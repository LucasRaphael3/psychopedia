"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { articles } from "@/db/schema";
import { logger } from "@/lib/logger";
import { slugify } from "@/lib/slug";
import { getCurrentUser } from "@/features/auth/session";
import type { FormState } from "@/features/auth/schemas";
import { slugExists } from "./queries";
import { articleSchema } from "./schemas";

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
  await db.insert(articles).values({ ...parsed.data, slug, authorId: user.id });
  logger.info({ userId: user.id, slug }, "Article published");
  revalidatePath("/");
  redirect(`/artigos/${slug}`);
}
