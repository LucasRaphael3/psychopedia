import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [index("messages_conversation_created_idx").on(t.conversationId, t.createdAt)],
).enableRLS();

export type User = typeof users.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Message = typeof messages.$inferSelect;
