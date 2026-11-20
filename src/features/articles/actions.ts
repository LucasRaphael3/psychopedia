"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { articles } from "@/db/schema";
import { logger } from "@/lib/logger";
import { slugify } from "@/lib/slug";
import { getCurrentUser } from "@/features/auth/session";
import type { FormState } from "@/features/auth/schemas";
import { slugExists } from "./queries";
import { articleSchema, SEARCH_COOKIE, searchTermSchema } from "./schemas";

/**
 * Search is a POST that stores the term in a short-lived cookie and opens /busca,
 * so the term never appears in the URL or in the browsing history.
 */
export async function submitSearch(formData: FormData) {
  const term = searchTermSchema.parse(String(formData.get("q") ?? ""));
  const store = await cookies();
  if (term) {
    store.set(SEARCH_COOKIE, term, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/busca",
      maxAge: 60 * 30,
    });
  } else {
    store.delete({ name: SEARCH_COOKIE, path: "/busca" });
  }
  redirect("/busca");
}

const FIELDS = ["title", "summary", "category", "content", "sourceUrl"] as const;

export async function createArticle(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Entre na sua conta para publicar." };

  const values = Object.fromEntries(FIELDS.map((k) => [k, String(formData.get(k) ?? "")]));
  const parsed = articleSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

  let slug = slugify(parsed.data.title) || "artigo";
  if (await slugExists(slug)) slug = `${slug}-${randomBytes(3).toString("hex")}`;

  const db = getDb();
  const [created] = await db.insert(articles).values({ ...parsed.data, slug, authorId: user.id }).returning({ id: articles.id });
  logger.info({ userId: user.id, articleId: created.id }, "Article published");
  revalidatePath("/");
  redirect(`/artigos/${created.id}`);
}
