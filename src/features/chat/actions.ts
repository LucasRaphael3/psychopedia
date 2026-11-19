"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { articles, users } from "@/db/schema";
import type { FormState } from "@/features/auth/schemas";
import { getCurrentUser } from "@/features/auth/session";
import { type ChatMessage, findOrCreateConversation, getConversationForUser, insertMessage } from "./queries";
import { messageSchema, shareSchema } from "./schemas";

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

export async function sendMessage(input: { conversationId: string; body: string }): Promise<{ ok: true; message: ChatMessage } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Mensagem inválida." };

  const conversation = await getConversationForUser(parsed.data.conversationId, user.id);
  if (!conversation) return { ok: false, error: "Conversa não encontrada." };

  const created = await insertMessage({ conversationId: conversation.id, senderId: user.id, body: parsed.data.body });
  return {
    ok: true,
    message: { id: created.id, body: parsed.data.body, senderId: user.id, createdAt: created.createdAt.toISOString(), article: null },
  };
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
