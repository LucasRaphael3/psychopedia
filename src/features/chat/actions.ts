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
import type { Reaction } from "./chat-state";
import { detectImageType, MAX_IMAGE_BYTES } from "./image";
import {
  type ChatMessage,
  findOrCreateConversation,
  getConversationForUser,
  getMessageForUser,
  imageUrl,
  insertMessage,
  isParticipant,
  isVideoPathUsed,
  toggleMessageReaction,
  videoUrl,
} from "./queries";
import { imageMessageSchema, messageSchema, reactionSchema, shareSchema, videoMessageSchema, videoUploadSchema } from "./schemas";
import { createVideoUploadUrl, deleteChatImage, deleteChatVideo, readVideoHead, uploadChatImage } from "./storage";
import { isVideoType, matchesVideoSignature, MAX_VIDEO_BYTES, VIDEO_PATH_PATTERN, VIDEO_TYPES } from "./video";

type Failure = { ok: false; error: string };
type SendResult = { ok: true; message: ChatMessage } | Failure;

const SESSION_EXPIRED: Failure = { ok: false, error: "Sua sessão expirou. Entre novamente." };
const UNSUPPORTED_VIDEO = "Formato de vídeo não suportado. Use MP4, MOV ou WebM.";

function sentMessage(created: { id: string; createdAt: Date }, senderId: string, body: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return { id: created.id, body, senderId, createdAt: created.createdAt.toISOString(), article: null, image: null, video: null, reactions: [], ...extra };
}

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
  if (!user) return SESSION_EXPIRED;
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Mensagem inválida." };

  const conversation = await getConversationForUser(parsed.data.conversationId, user.id);
  if (!conversation) return { ok: false, error: "Conversa não encontrada." };

  const created = await insertMessage({ conversationId: conversation.id, senderId: user.id, body: parsed.data.body });
  return { ok: true, message: sentMessage(created, user.id, parsed.data.body) };
}

/** Uploads a photo (already resized/re-encoded by the client) to private storage and posts it. */
export async function sendImageMessage(formData: FormData): Promise<SendResult> {
  const user = await getCurrentUser();
  if (!user) return SESSION_EXPIRED;

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
    return { ok: true, message: sentMessage(created, user.id, caption, { image: { url: imageUrl(created.id), width, height } }) };
  } catch (error) {
    await deleteChatImage(path).catch(() => undefined);
    throw error;
  }
}

/**
 * Step 1 of a video message: a one-time signed URL for the browser to upload the file straight to
 * private storage (videos are too large to pass through a function). The key embeds conversation and sender.
 */
export async function createVideoUpload(input: { conversationId: string; contentType: string; size: number }) {
  const user = await getCurrentUser();
  if (!user) return SESSION_EXPIRED;
  const parsed = videoUploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? UNSUPPORTED_VIDEO };
  const { conversationId, contentType } = parsed.data;
  if (!isVideoType(contentType) || !(await isParticipant(conversationId, user.id))) return { ok: false as const, error: "Conversa não encontrada." };

  const path = `${conversationId}/${user.id}/${randomUUID()}.${VIDEO_TYPES[contentType]}`;
  try {
    return { ok: true as const, path, uploadUrl: await createVideoUploadUrl(path) };
  } catch (error) {
    logger.error({ userId: user.id, err: (error as Error).message }, "Chat video upload URL failed");
    return { ok: false as const, error: "Não foi possível preparar o envio do vídeo. Tente novamente." };
  }
}

/** Step 2: checks the uploaded object (owner, type, signature, size) and posts the message. */
export async function sendVideoMessage(input: { conversationId: string; path: string; caption: string; width: number; height: number }): Promise<SendResult> {
  const user = await getCurrentUser();
  if (!user) return SESSION_EXPIRED;
  const parsed = videoMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Vídeo inválido." };
  const { conversationId, path, caption, width, height } = parsed.data;

  const [, pathConversation, pathSender, ext] = VIDEO_PATH_PATTERN.exec(path) ?? [];
  if (pathConversation !== conversationId || pathSender !== user.id) return { ok: false, error: "Vídeo inválido." };
  const conversation = await getConversationForUser(conversationId, user.id);
  if (!conversation) return { ok: false, error: "Conversa não encontrada." };
  if (await isVideoPathUsed(path)) return { ok: false, error: "Este vídeo já foi enviado." };

  const head = await readVideoHead(path);
  if (!head) return { ok: false, error: "O envio do vídeo não foi concluído. Tente novamente." };
  const type = head.contentType.split(";")[0].trim().toLowerCase();
  const valid = isVideoType(type) && VIDEO_TYPES[type] === ext && head.size <= MAX_VIDEO_BYTES && matchesVideoSignature(type, head.bytes);
  if (!valid) {
    await deleteChatVideo(path).catch(() => undefined);
    logger.warn({ userId: user.id, type, size: head.size }, "Rejected chat video upload");
    return { ok: false, error: UNSUPPORTED_VIDEO };
  }

  const created = await insertMessage({ conversationId: conversation.id, senderId: user.id, body: caption, video: { path, width, height } });
  return { ok: true, message: sentMessage(created, user.id, caption, { video: { url: videoUrl(created.id), width, height } }) };
}

/** Adds, replaces or removes (same emoji again) the user's reaction; returns the message's reactions. */
export async function toggleReaction(input: { messageId: string; emoji: string }): Promise<{ ok: true; reactions: Reaction[] } | Failure> {
  const user = await getCurrentUser();
  if (!user) return SESSION_EXPIRED;
  const parsed = reactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Reação inválida." };
  const message = await getMessageForUser(parsed.data.messageId, user.id);
  if (!message) return { ok: false, error: "Mensagem não encontrada." };
  return { ok: true, reactions: await toggleMessageReaction(message.id, user.id, parsed.data.emoji) };
}

export async function shareArticle(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Entre na sua conta para compartilhar." };
  const values = { articleId: String(formData.get("articleId") ?? ""), username: String(formData.get("username") ?? ""), note: String(formData.get("note") ?? "") };
  const parsed = shareSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

  const otherId = await findUserId(parsed.data.username);
  if (!otherId) return { errors: { username: ["Usuário não encontrado."] }, values };
  if (otherId === user.id) return { errors: { username: ["Escolha outra pessoa."] }, values };

  const db = getDb();
  const [article] = await db.select({ id: articles.id, title: articles.title }).from(articles).where(eq(articles.id, parsed.data.articleId)).limit(1);
  if (!article) return { message: "Artigo não encontrado.", values };

  const conversationId = await findOrCreateConversation(user.id, otherId);
  const body = parsed.data.note || `Achei que você ia gostar deste artigo: “${article.title}”`;
  await insertMessage({ conversationId, senderId: user.id, body, articleId: article.id });
  redirect(`/mensagens/${conversationId}`);
}
