import { z } from "zod";

export const messageSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().trim().min(1, "Escreva uma mensagem.").max(2000, "Mensagem muito longa."),
});

export const shareSchema = z.object({
  slug: z.string().min(1).max(120),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,24}$/, "Usuário inválido."),
  note: z.string().trim().max(500, "Mensagem muito longa.").default(""),
});

/** Conversations store participants ordered so each pair maps to one row. */
export function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
