import "server-only";
import { databaseUrlSchema, logLevelSchema, parseEnv, secretKeySchema, supabaseUrlSchema } from "./env-schema";

/** Supabase Storage credentials; the secret key bypasses RLS and must stay server-side. */
export function getStorageConfig() {
  return {
    url: parseEnv("SUPABASE_URL", process.env.SUPABASE_URL, supabaseUrlSchema),
    key: parseEnv("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY, secretKeySchema),
  };
}

export function getDatabaseUrl() {
  return parseEnv("DATABASE_URL", process.env.DATABASE_URL, databaseUrlSchema);
}

export function getLogLevel() {
  return parseEnv("LOG_LEVEL", process.env.LOG_LEVEL, logLevelSchema);
}
