"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { articles, users } from "@/db/schema";
import type { FormState } from "@/features/auth/schemas";
import { getCurrentUser } from "@/features/auth/session";
import { logger } from "@/lib/logger";
import { detectImageType, MAX_IMAGE_BYTES } from "./image";
import { type ChatMessage, findOrCreateConversation, getConversationForUser, imageUrl, insertMessage } from "./queries";
import { imageMessageSchema, messageSchema, shareSchema } from "./schemas";
import { deleteChatImage, uploadChatImage } from "./storage";

type SendResult = { ok: true; message: ChatMessage } | { ok: false; error: string };

async function findUserId(username: string) {
  const db = getDb();
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  return row?.id ?? null;
}

/** Opens (or creates) a conversation with another user and navigates to it. */
export async function startConversation(formData: FormData) {
  const user = await getCurrentUser();
  const username = String(formData.get("username") ?? "").toLowerCase();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(`/autores/${username}`)}`);
  const otherId = await findUserId(username);
  if (!otherId || otherId === user.id) redirect("/mensagens");
  const conversationId = await findOrCreateConversation(user.id, otherId);
  redirect(`/mensagens/${conversationId}`);
}

export async function sendMessage(input: { conversationId: string; body: string }): Promise<SendResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Mensagem inválida." };

  const conversation = await getConversationForUser(parsed.data.conversationId, user.id);
  if (!conversation) return { ok: false, error: "Conversa não encontrada." };

  const created = await insertMessage({ conversationId: conversation.id, senderId: user.id, body: parsed.data.body });
  return {
    ok: true,
    message: { id: created.id, body: parsed.data.body, senderId: user.id, createdAt: created.createdAt.toISOString(), article: null, image: null },
  };
}

/** Uploads a photo (already resized/re-encoded by the client) to private storage and posts it. */
export async function sendImageMessage(formData: FormData): Promise<SendResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };

  const parsed = imageMessageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    caption: formData.get("caption") ?? "",
    width: formData.get("width"),
    height: formData.get("height"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Foto inválida." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Escolha uma foto." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "A foto precisa ter no máximo 4 MB." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImageType(bytes);
  if (!kind) return { ok: false, error: "Formato não suportado. Use JPG, PNG ou WebP." };

  const conversation = await getConversationForUser(parsed.data.conversationId, user.id);
  if (!conversation) return { ok: false, error: "Conversa não encontrada." };

  const { caption, width, height } = parsed.data;
  const path = `${conversation.id}/${randomUUID()}.${kind.ext}`;
  try {
    await uploadChatImage(path, bytes, kind.type);
  } catch (error) {
    logger.error({ userId: user.id, err: (error as Error).message }, "Chat image upload failed");
    return { ok: false, error: "Não foi possível enviar a foto. Tente novamente." };
  }

  try {
    const created = await insertMessage({ conversationId: conversation.id, senderId: user.id, body: caption, image: { path, width, height } });
    return {
      ok: true,
      message: {
        id: created.id,
        body: caption,
        senderId: user.id,
        createdAt: created.createdAt.toISOString(),
        article: null,
        image: { url: imageUrl(created.id), width, height },
      },
    };
  } catch (error) {
    await deleteChatImage(path).catch(() => undefined);
    throw error;
  }
}

export async function shareArticle(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Entre na sua conta para compartilhar." };
  const values = { slug: String(formData.get("slug") ?? ""), username: String(formData.get("username") ?? ""), note: String(formData.get("note") ?? "") };
  const parsed = shareSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

  const otherId = await findUserId(parsed.data.username);
  if (!otherId) return { errors: { username: ["Usuário não encontrado."] }, values };
  if (otherId === user.id) return { errors: { username: ["Escolha outra pessoa."] }, values };

  const db = getDb();
  const [article] = await db.select({ id: articles.id, title: articles.title }).from(articles).where(eq(articles.slug, parsed.data.slug)).limit(1);
  if (!article) return { message: "Artigo não encontrado.", values };

  const conversationId = await findOrCreateConversation(user.id, otherId);
  const body = parsed.data.note || `Achei que você ia gostar deste artigo: “${article.title}”`;
  await insertMessage({ conversationId, senderId: user.id, body, articleId: article.id });
  redirect(`/mensagens/${conversationId}`);
}
