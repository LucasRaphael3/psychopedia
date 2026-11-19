"use server";

import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { logger } from "@/lib/logger";
import { safeNext } from "@/lib/safe-next";
import { type FormState, loginSchema, signupSchema } from "./schemas";
import { createSession, destroySession } from "./session";

// Hash compared when the e-mail does not exist, keeping login timing similar.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("psychopedia-timing-guard", 12));

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(["name", "username", "email", "password"].map((k) => [k, String(formData.get(k) ?? "")]));
  const values = { name: raw.name, username: raw.username, email: raw.email };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

  const { name, username, email, password } = parsed.data;
  const db = getDb();
  const [taken] = await db
    .select({ username: users.username, email: users.email })
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)))
    .limit(1);
  if (taken) {
    const errors = taken.email === email ? { email: ["Este e-mail já está cadastrado."] } : { username: ["Este nome de usuário já existe."] };
    return { errors, values };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(users).values({ name, username, email, passwordHash }).returning({ id: users.id });
  await createSession(user.id);
  logger.info({ userId: user.id }, "User signed up");
  redirect("/");
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const raw = { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") };
  const values = { email: raw.email };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

  const db = getDb();
  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid) return { message: "E-mail ou senha incorretos.", values };

  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
