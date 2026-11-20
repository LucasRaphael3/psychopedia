import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { z } from "zod";
import { count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { articles, users } from "@/db/schema";
import { SEARCH_COOKIE, searchTermSchema } from "./schemas";

export const PAGE_SIZE = 10;

const cardFields = {
  id: articles.id,
  slug: articles.slug,
  title: articles.title,
  summary: articles.summary,
  category: articles.category,
  createdAt: articles.createdAt,
  authorName: users.name,
  authorUsername: users.username,
};

function escapeLike(term: string) {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

async function listWhere(where: SQL | undefined, page: number, pageSize = PAGE_SIZE) {
  const db = getDb();
  const offset = (Math.max(1, page) - 1) * pageSize;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(cardFields)
      .from(articles)
      .innerJoin(users, eq(users.id, articles.authorId))
      .where(where)
      .orderBy(desc(articles.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(articles).where(where),
  ]);
  return { rows, total, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export type ArticleCard = Awaited<ReturnType<typeof listWhere>>["rows"][number];

export function listLatest(page = 1, pageSize = PAGE_SIZE) {
  return listWhere(undefined, page, pageSize);
}

export function listByCategory(category: string, page = 1) {
  return listWhere(eq(articles.category, category), page);
}

export function listByAuthor(authorId: string, page = 1) {
  return listWhere(eq(articles.authorId, authorId), page);
}

export async function getSearchTerm() {
  return searchTermSchema.parse((await cookies()).get(SEARCH_COOKIE)?.value ?? "");
}

export function searchArticles(term: string, page = 1) {
  const pattern = `%${escapeLike(term)}%`;
  return listWhere(or(ilike(articles.title, pattern), ilike(articles.summary, pattern)), page);
}

/**
 * Looks an article up by id (the public URL) or, for old links, by slug.
 * URLs use the id so the browsing history doesn't reveal the article's topic.
 */
export const getArticle = cache(async (ref: string) => {
  const db = getDb();
  const [row] = await db
    .select({ ...cardFields, content: articles.content, sourceUrl: articles.sourceUrl, authorId: articles.authorId, authorBio: users.bio })
    .from(articles)
    .innerJoin(users, eq(users.id, articles.authorId))
    .where(z.uuid().safeParse(ref).success ? eq(articles.id, ref) : eq(articles.slug, ref))
    .limit(1);
  return row ?? null;
});

export async function listRelated(category: string, excludeId: string, limit = 4) {
  const db = getDb();
  const rows = await db
    .select(cardFields)
    .from(articles)
    .innerJoin(users, eq(users.id, articles.authorId))
    .where(eq(articles.category, category))
    .orderBy(desc(articles.createdAt))
    .limit(limit + 1);
  return rows.filter((r) => r.id !== excludeId).slice(0, limit);
}

export async function listTopAuthors(limit = 4) {
  const db = getDb();
  return db
    .select({ name: users.name, username: users.username, bio: users.bio, total: count(articles.id) })
    .from(users)
    .innerJoin(articles, eq(articles.authorId, users.id))
    .groupBy(users.id)
    .orderBy(desc(count(articles.id)))
    .limit(limit);
}

export async function slugExists(slug: string) {
  const db = getDb();
  const [row] = await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, slug)).limit(1);
  return Boolean(row);
}
