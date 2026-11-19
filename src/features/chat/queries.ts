import "server-only";
import { aliasedTable, and, count, desc, eq, gt, inArray, isNull, ne, or } from "drizzle-orm";
import { getDb } from "@/db";
import { articles, conversations, messages, users } from "@/db/schema";
import { orderPair } from "./schemas";

const MESSAGE_LIMIT = 200;

export type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  article: { slug: string; title: string; summary: string } | null;
  image: { url: string; width: number; height: number } | null;
};

export type ChatImageInput = { path: string; width: number; height: number };

export function imageUrl(messageId: string) {
  return `/api/chat/images/${messageId}`;
}

function participantOf(userId: string) {
  return or(eq(conversations.userAId, userId), eq(conversations.userBId, userId));
}

export async function findOrCreateConversation(userId: string, otherId: string) {
  const [userAId, userBId] = orderPair(userId, otherId);
  const db = getDb();
  await db.insert(conversations).values({ userAId, userBId }).onConflictDoNothing();
  const [row] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.userAId, userAId), eq(conversations.userBId, userBId)))
    .limit(1);
  return row.id;
}

/** Returns the conversation and the other participant, or null if the user is not part of it. */
export async function getConversationForUser(conversationId: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: conversations.id, userAId: conversations.userAId, userBId: conversations.userBId })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), participantOf(userId)))
    .limit(1);
  if (!row) return null;
  const otherId = row.userAId === userId ? row.userBId : row.userAId;
  const [other] = await db.select({ id: users.id, name: users.name, username: users.username }).from(users).where(eq(users.id, otherId)).limit(1);
  return { id: row.id, other };
}

export async function listMessages(conversationId: string, after?: Date): Promise<ChatMessage[]> {
  const db = getDb();
  const where = after ? and(eq(messages.conversationId, conversationId), gt(messages.createdAt, after)) : eq(messages.conversationId, conversationId);
  const rows = await db
    .select({
      id: messages.id,
      body: messages.body,
      senderId: messages.senderId,
      createdAt: messages.createdAt,
      articleSlug: articles.slug,
      articleTitle: articles.title,
      articleSummary: articles.summary,
      imagePath: messages.imagePath,
      imageWidth: messages.imageWidth,
      imageHeight: messages.imageHeight,
    })
    .from(messages)
    .leftJoin(articles, eq(articles.id, messages.articleId))
    .where(where)
    .orderBy(desc(messages.createdAt))
    .limit(MESSAGE_LIMIT);
  return rows.reverse().map((r) => ({
    id: r.id,
    body: r.body,
    senderId: r.senderId,
    createdAt: r.createdAt.toISOString(),
    article: r.articleSlug && r.articleTitle ? { slug: r.articleSlug, title: r.articleTitle, summary: r.articleSummary ?? "" } : null,
    image: r.imagePath ? { url: imageUrl(r.id), width: r.imageWidth ?? 800, height: r.imageHeight ?? 600 } : null,
  }));
}

/** Storage path of a message image, only if the user participates in its conversation. */
export async function getImagePathForUser(messageId: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ path: messages.imagePath })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(and(eq(messages.id, messageId), participantOf(userId)))
    .limit(1);
  return row?.path ?? null;
}

export async function markConversationRead(conversationId: string, userId: string) {
  const db = getDb();
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.conversationId, conversationId), ne(messages.senderId, userId), isNull(messages.readAt)));
}

export async function listConversations(userId: string) {
  const db = getDb();
  const userA = aliasedTable(users, "user_a");
  const userB = aliasedTable(users, "user_b");
  const convs = await db
    .select({
      id: conversations.id,
      updatedAt: conversations.updatedAt,
      userAId: conversations.userAId,
      aName: userA.name,
      aUsername: userA.username,
      bName: userB.name,
      bUsername: userB.username,
    })
    .from(conversations)
    .innerJoin(userA, eq(userA.id, conversations.userAId))
    .innerJoin(userB, eq(userB.id, conversations.userBId))
    .where(participantOf(userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(50);
  if (convs.length === 0) return [];

  const ids = convs.map((c) => c.id);
  const [lastMessages, unread] = await Promise.all([
    db
      .selectDistinctOn([messages.conversationId], {
        conversationId: messages.conversationId,
        body: messages.body,
        senderId: messages.senderId,
        imagePath: messages.imagePath,
      })
      .from(messages)
      .where(inArray(messages.conversationId, ids))
      .orderBy(messages.conversationId, desc(messages.createdAt)),
    db
      .select({ conversationId: messages.conversationId, total: count() })
      .from(messages)
      .where(and(inArray(messages.conversationId, ids), ne(messages.senderId, userId), isNull(messages.readAt)))
      .groupBy(messages.conversationId),
  ]);
  const lastById = new Map(lastMessages.map((m) => [m.conversationId, m]));
  const unreadById = new Map(unread.map((u) => [u.conversationId, u.total]));

  return convs.map((c) => {
    const isA = c.userAId === userId;
    const last = lastById.get(c.id);
    return {
      id: c.id,
      updatedAt: c.updatedAt,
      other: isA ? { name: c.bName, username: c.bUsername } : { name: c.aName, username: c.aUsername },
      lastMessage: last ? `${last.senderId === userId ? "Você: " : ""}${last.body || (last.imagePath ? "📷 Foto" : "")}` : "",
      unread: unreadById.get(c.id) ?? 0,
    };
  });
}

export async function countUnread(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ total: count() })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(and(participantOf(userId), ne(messages.senderId, userId), isNull(messages.readAt)));
  return row?.total ?? 0;
}

type NewMessage = { conversationId: string; senderId: string; body: string; articleId?: string | null; image?: ChatImageInput };

export async function insertMessage({ image, ...input }: NewMessage) {
  const db = getDb();
  const values = image ? { ...input, imagePath: image.path, imageWidth: image.width, imageHeight: image.height } : input;
  const message = await db.transaction(async (tx) => {
    const [created] = await tx.insert(messages).values(values).returning({ id: messages.id, createdAt: messages.createdAt });
    await tx.update(conversations).set({ updatedAt: created.createdAt }).where(eq(conversations.id, input.conversationId));
    return created;
  });
  return message;
}
