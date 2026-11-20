import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// RLS is enabled without policies so Supabase's public Data API cannot read these tables;
// the app connects with a privileged role that bypasses RLS.

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    bio: text("bio").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_username_idx").on(t.username), uniqueIndex("users_email_idx").on(t.email)],
).enableRLS();

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 of the cookie token; the raw token never reaches the database.
    id: text("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
).enableRLS();

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    category: text("category").notNull(),
    sourceUrl: text("source_url"),
    authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("articles_slug_idx").on(t.slug),
    index("articles_category_created_idx").on(t.category, t.createdAt),
    index("articles_author_idx").on(t.authorId),
    index("articles_created_idx").on(t.createdAt),
  ],
).enableRLS();

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Participants are stored ordered (userA < userB) so each pair has one conversation.
    userAId: uuid("user_a_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    userBId: uuid("user_b_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("conversations_pair_idx").on(t.userAId, t.userBId),
    index("conversations_user_b_idx").on(t.userBId),
    check("conversations_ordered_pair", sql`${t.userAId} < ${t.userBId}`),
  ],
).enableRLS();

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    articleId: uuid("article_id").references(() => articles.id, { onDelete: "set null" }),
    // Object key in the private Supabase Storage bucket; served only to participants.
    imagePath: text("image_path"),
    imageWidth: integer("image_width"),
    imageHeight: integer("image_height"),
    // Videos are uploaded by the browser straight to a private bucket (signed upload URL).
    videoPath: text("video_path"),
    videoWidth: integer("video_width"),
    videoHeight: integer("video_height"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [
    index("messages_conversation_created_idx").on(t.conversationId, t.createdAt),
    // An uploaded video can back only one message.
    uniqueIndex("messages_video_path_idx").on(t.videoPath),
  ],
).enableRLS();

export const messageReactions = pgTable(
  "message_reactions",
  {
    messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // One reaction per person per message; reacting again replaces it.
  (t) => [
    primaryKey({ columns: [t.messageId, t.userId] }),
    check("message_reactions_emoji_length", sql`char_length(${t.emoji}) between 1 and 16`),
  ],
).enableRLS();

export const typingIndicators = pgTable(
  "typing_indicators",
  {
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    // Refreshed by the composer while the person types; considered stale after a few seconds.
    typedAt: timestamp("typed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.conversationId, t.userId] })],
).enableRLS();

export type User = typeof users.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Message = typeof messages.$inferSelect;
