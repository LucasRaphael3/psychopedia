import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export async function getPublicProfile(username: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id, name: users.name, username: users.username, bio: users.bio, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  return row ?? null;
}
