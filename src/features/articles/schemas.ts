import { z } from "zod";
import { CATEGORY_SLUGS } from "@/lib/categories";

/** Search term kept in a cookie (never in the URL); see `submitSearch`. */
export const SEARCH_COOKIE = "psy_busca";
export const searchTermSchema = z.string().trim().max(100).catch("");

export const articleSchema = z.object({
  title: z.string().trim().min(8, "O título precisa de pelo menos 8 caracteres.").max(140, "Título muito longo."),
  summary: z.string().trim().min(20, "Escreva um resumo de pelo menos 20 caracteres.").max(300, "Resumo muito longo."),
  category: z.enum(CATEGORY_SLUGS, { error: "Escolha uma categoria." }),
  content: z.string().trim().min(200, "O artigo precisa de pelo menos 200 caracteres.").max(30_000, "Artigo muito longo."),
  sourceUrl: z
    .union([z.literal(""), z.url({ protocol: /^https?$/, error: "Use um link http(s) válido." })])
    .transform((v) => v || null),
});
