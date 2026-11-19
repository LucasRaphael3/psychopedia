// Creates (or updates) the private Supabase Storage bucket for chat photos.
// Uses DATABASE_URL directly; safe to run more than once.
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definido (.env.local).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(
    `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
     VALUES ('chat-images', 'chat-images', false, 4194304, ARRAY['image/jpeg','image/png','image/webp'])
     ON CONFLICT (id) DO UPDATE SET public = false,
       file_size_limit = EXCLUDED.file_size_limit,
       allowed_mime_types = EXCLUDED.allowed_mime_types`,
  );
  const { rows } = await client.query("SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'chat-images'");
  console.log("Bucket pronto:", rows[0]);
} catch (error) {
  console.error("Falha ao criar o bucket:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
