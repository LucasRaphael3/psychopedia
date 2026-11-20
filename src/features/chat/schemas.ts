import { z } from "zod";
import { isAllowedEmoji } from "./emoji-data";
import { MAX_IMAGE_DIMENSION } from "./image";
import { isVideoType, MAX_VIDEO_BYTES, MAX_VIDEO_DIMENSION, VIDEO_PATH_PATTERN } from "./video";

export const messageSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().trim().min(1, "Escreva uma mensagem.").max(2000, "Mensagem muito longa."),
});

const caption = z.string().trim().max(2000, "Legenda muito longa.").default("");

export const imageMessageSchema = z.object({
  conversationId: z.uuid(),
  caption,
  width: z.coerce.number().int().min(1).max(MAX_IMAGE_DIMENSION),
  height: z.coerce.number().int().min(1).max(MAX_IMAGE_DIMENSION),
});

export const videoUploadSchema = z.object({
  conversationId: z.uuid(),
  contentType: z.string().refine(isVideoType, "Formato de vídeo não suportado. Use MP4, MOV ou WebM."),
  size: z.number().int().min(1, "O vídeo está vazio.").max(MAX_VIDEO_BYTES, "O vídeo precisa ter no máximo 50 MB."),
});

export const videoMessageSchema = z.object({
  conversationId: z.uuid(),
  path: z.string().regex(VIDEO_PATH_PATTERN, "Vídeo inválido."),
  caption,
  width: z.number().int().min(1).max(MAX_VIDEO_DIMENSION),
  height: z.number().int().min(1).max(MAX_VIDEO_DIMENSION),
});

export const reactionSchema = z.object({
  messageId: z.uuid(),
  emoji: z.string().refine(isAllowedEmoji, "Reação inválida."),
});

export const shareSchema = z.object({
  articleId: z.uuid(),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,24}$/, "Usuário inválido."),
  note: z.string().trim().max(500, "Mensagem muito longa.").default(""),
});

/** Conversations store participants ordered so each pair maps to one row. */
export function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
