// Inserts demo authors and articles into the database from DATABASE_URL.
// Idempotent: existing users (by e-mail) and articles (by slug) are skipped.
import bcrypt from "bcryptjs";
import pg from "pg";
import { articles, authors, DEMO_PASSWORD } from "./seed-data.mjs";

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definido (.env.local).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query("BEGIN");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const ids = new Map();
  for (const a of authors) {
    const { rows } = await client.query(
      `INSERT INTO users (name, username, email, password_hash, bio) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET bio = EXCLUDED.bio RETURNING id`,
      [a.name, a.username, a.email, passwordHash, a.bio],
    );
    ids.set(a.username, rows[0].id);
  }

  let inserted = 0;
  for (const [i, art] of articles.entries()) {
    // Spread creation dates so the home page has a believable order.
    const createdAt = new Date(Date.now() - (articles.length - i) * 7 * 60 * 60 * 1000);
    const result = await client.query(
      `INSERT INTO articles (slug, title, summary, content, category, author_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (slug) DO NOTHING`,
      [slugify(art.title), art.title, art.summary, art.content, art.category, ids.get(art.author), createdAt],
    );
    inserted += result.rowCount ?? 0;
  }
  await client.query("COMMIT");
  console.log(`Seed concluído: ${authors.length} autores, ${inserted} artigos novos.`);
  console.log(`Login de demonstração: ${authors[0].email} / ${DEMO_PASSWORD}`);
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Falha no seed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
