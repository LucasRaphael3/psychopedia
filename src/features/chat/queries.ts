import "server-only";
import { aliasedTable, and, count, desc, eq, gt, gte, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { articles, conversations, messageReactions, messages, typingIndicators, users } from "@/db/schema";
import type { Reaction, ReactionRow } from "./chat-state";
import { orderPair } from "./schemas";

const MESSAGE_LIMIT = 200;
const REACTION_LIMIT = 2000;

export type ChatMedia = { url: string; width: number; height: number };

export type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  article: { id: string; title: string; summary: string } | null;
  image: ChatMedia | null;
  video: ChatMedia | null;
  reactions: Reaction[];
};

export type ChatMediaInput = { path: string; width: number; height: number };

export function imageUrl(messageId: string) {
  return `/api/chat/images/${messageId}`;
}

export function videoUrl(messageId: string) {
  return `/api/chat/videos/${messageId}`;
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

export async function isParticipant(conversationId: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), participantOf(userId)))
    .limit(1);
  return Boolean(row);
}

async function listReactionsFor(messageIds: string[]) {
  if (messageIds.length === 0) return [];
  const db = getDb();
  return db
    .select({ messageId: messageReactions.messageId, emoji: messageReactions.emoji, userId: messageReactions.userId })
    .from(messageReactions)
    .where(inArray(messageReactions.messageId, messageIds))
    .orderBy(messageReactions.createdAt);
}

/** Every reaction on messages created at or after `since` (the oldest message the client holds). */
export async function listReactionsSince(conversationId: string, since: Date): Promise<ReactionRow[]> {
  const db = getDb();
  return db
    .select({ messageId: messageReactions.messageId, emoji: messageReactions.emoji, userId: messageReactions.userId })
    .from(messageReactions)
    .innerJoin(messages, eq(messages.id, messageReactions.messageId))
    .where(and(eq(messages.conversationId, conversationId), gte(messages.createdAt, since)))
    .orderBy(messageReactions.createdAt)
    .limit(REACTION_LIMIT);
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
      articleId: articles.id,
      articleTitle: articles.title,
      articleSummary: articles.summary,
      imagePath: messages.imagePath,
      imageWidth: messages.imageWidth,
      imageHeight: messages.imageHeight,
      videoPath: messages.videoPath,
      videoWidth: messages.videoWidth,
      videoHeight: messages.videoHeight,
    })
    .from(messages)
    .leftJoin(articles, eq(articles.id, messages.articleId))
    .where(where)
    .orderBy(desc(messages.createdAt))
    .limit(MESSAGE_LIMIT);

  const reactions = await listReactionsFor(rows.map((r) => r.id));
  const reactionsById = new Map<string, Reaction[]>();
  for (const { messageId, emoji, userId } of reactions) reactionsById.set(messageId, [...(reactionsById.get(messageId) ?? []), { emoji, userId }]);

  return rows.reverse().map((r) => ({
    id: r.id,
    body: r.body,
    senderId: r.senderId,
    createdAt: r.createdAt.toISOString(),
    article: r.articleId && r.articleTitle ? { id: r.articleId, title: r.articleTitle, summary: r.articleSummary ?? "" } : null,
    image: r.imagePath ? { url: imageUrl(r.id), width: r.imageWidth ?? 800, height: r.imageHeight ?? 600 } : null,
    video: r.videoPath ? { url: videoUrl(r.id), width: r.videoWidth ?? 640, height: r.videoHeight ?? 360 } : null,
    reactions: reactionsById.get(r.id) ?? [],
  }));
}

/** A message with its media keys, only if the user participates in its conversation. */
export async function getMessageForUser(messageId: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: messages.id, conversationId: messages.conversationId, imagePath: messages.imagePath, videoPath: messages.videoPath })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(and(eq(messages.id, messageId), participantOf(userId)))
    .limit(1);
  return row ?? null;
}

export async function isVideoPathUsed(path: string) {
  const db = getDb();
  const [row] = await db.select({ id: messages.id }).from(messages).where(eq(messages.videoPath, path)).limit(1);
  return Boolean(row);
}

/** One reaction per person: the same emoji again removes it, another emoji replaces it. Returns the message's reactions. */
export async function toggleMessageReaction(messageId: string, userId: string, emoji: string) {
  const db = getDb();
  const mine = and(eq(messageReactions.messageId, messageId), eq(messageReactions.userId, userId));
  const [current] = await db.select({ emoji: messageReactions.emoji }).from(messageReactions).where(mine).limit(1);
  if (current?.emoji === emoji) {
    await db.delete(messageReactions).where(mine);
  } else {
    await db
      .insert(messageReactions)
      .values({ messageId, userId, emoji })
      .onConflictDoUpdate({ target: [messageReactions.messageId, messageReactions.userId], set: { emoji, createdAt: new Date() } });
  }
  return (await listReactionsFor([messageId])).map(({ emoji: e, userId: u }) => ({ emoji: e, userId: u }));
}

export async function setTyping(conversationId: string, userId: string) {
  const db = getDb();
  await db
    .insert(typingIndicators)
    .values({ conversationId, userId, typedAt: sql`now()` })
    .onConflictDoUpdate({ target: [typingIndicators.conversationId, typingIndicators.userId], set: { typedAt: sql`now()` } });
}

export async function clearTyping(conversationId: string, userId: string) {
  const db = getDb();
  await db.delete(typingIndicators).where(and(eq(typingIndicators.conversationId, conversationId), eq(typingIndicators.userId, userId)));
}

/** True while the other participant refreshed their typing signal in the last 6 seconds (database clock). */
export async function isOtherTyping(conversationId: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ userId: typingIndicators.userId })
    .from(typingIndicators)
    .where(
      and(
        eq(typingIndicators.conversationId, conversationId),
        ne(typingIndicators.userId, userId),
        gt(typingIndicators.typedAt, sql`now() - interval '6 seconds'`),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function markConversationRead(conversationId: string, userId: string) {
  const db = getDb();
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.conversationId, conversationId), ne(messages.senderId, userId), isNull(messages.readAt)));
}

function previewText(last: { body: string; imagePath: string | null; videoPath: string | null }) {
  if (last.body) return last.body;
  if (last.imagePath) return "📷 Foto";
  return last.videoPath ? "🎥 Vídeo" : "";
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
        videoPath: messages.videoPath,
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
      lastMessage: last ? `${last.senderId === userId ? "Você: " : ""}${previewText(last)}` : "",
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

type NewMessage = {
  conversationId: string;
  senderId: string;
  body: string;
  articleId?: string | null;
  image?: ChatMediaInput;
  video?: ChatMediaInput;
};

export async function insertMessage({ image, video, ...input }: NewMessage) {
  const db = getDb();
  const values = {
    ...input,
    ...(image && { imagePath: image.path, imageWidth: image.width, imageHeight: image.height }),
    ...(video && { videoPath: video.path, videoWidth: video.width, videoHeight: video.height }),
  };
  const message = await db.transaction(async (tx) => {
    const [created] = await tx.insert(messages).values(values).returning({ id: messages.id, createdAt: messages.createdAt });
    await tx.update(conversations).set({ updatedAt: created.createdAt }).where(eq(conversations.id, input.conversationId));
    // Sending ends the "typing…" indicator right away instead of waiting for it to expire.
    await tx
      .delete(typingIndicators)
      .where(and(eq(typingIndicators.conversationId, input.conversationId), eq(typingIndicators.userId, input.senderId)));
    return created;
  });
  return message;
}
