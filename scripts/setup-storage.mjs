// Creates (or updates) the private Supabase Storage buckets for chat photos and videos.
// Uses DATABASE_URL directly; safe to run more than once.
import pg from "pg";

const BUCKETS = [
  // Photos are resized in the browser and uploaded by the server (4 MB).
  { id: "chat-images", limit: 4 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  // Videos go straight from the browser through a signed upload URL (50 MB, the free plan's per-file cap).
  { id: "chat-videos", limit: 50 * 1024 * 1024, types: ["video/mp4", "video/quicktime", "video/webm"] },
];

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definido (.env.local).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  for (const bucket of BUCKETS) {
    await client.query(
      `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
       VALUES ($1, $1, false, $2, $3)
       ON CONFLICT (id) DO UPDATE SET public = false,
         file_size_limit = EXCLUDED.file_size_limit,
         allowed_mime_types = EXCLUDED.allowed_mime_types`,
      [bucket.id, bucket.limit, bucket.types],
    );
  }
  const { rows } = await client.query(
    "SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = ANY($1) ORDER BY id",
    [BUCKETS.map((b) => b.id)],
  );
  console.log("Buckets prontos:", rows);
} catch (error) {
  console.error("Falha ao criar os buckets:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
