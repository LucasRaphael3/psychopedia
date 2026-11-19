import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleRow } from "@/components/article-card";
import { Avatar } from "@/components/avatar";
import { Pagination, parsePage, SectionTitle } from "@/components/pagination";
import { listByAuthor } from "@/features/articles/queries";
import { getCurrentUser } from "@/features/auth/session";
import { startConversation } from "@/features/chat/actions";
import { getPublicProfile } from "@/features/users/queries";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/autores/[username]">): Promise<Metadata> {
  const profile = await getPublicProfile((await params).username);
  return { title: profile?.name ?? "Autor" };
}

export default async function AuthorPage({ params, searchParams }: PageProps<"/autores/[username]">) {
  const profile = await getPublicProfile((await params).username);
  if (!profile) notFound();
  const page = parsePage((await searchParams).pagina);
  const [{ rows, pages, total }, viewer] = await Promise.all([listByAuthor(profile.id, page), getCurrentUser()]);
  const isSelf = viewer?.id === profile.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="flex flex-col items-start gap-6 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center">
        <Avatar name={profile.name} seed={profile.username} size="lg" />
        <div className="flex-1">
          <h1 className="font-serif text-3xl font-bold">{profile.name}</h1>
          <p className="text-sm text-muted">@{profile.username} · membro desde {formatDate(profile.createdAt)}</p>
          {profile.bio && <p className="mt-2">{profile.bio}</p>}
        </div>
        {isSelf ? (
          <Link href="/publicar" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">Publicar artigo</Link>
        ) : (
          <form action={startConversation}>
            <input type="hidden" name="username" value={profile.username} />
            <button type="submit" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
              Enviar mensagem
            </button>
          </form>
        )}
      </header>

      <section aria-labelledby="artigos-autor" className="mt-10">
        <SectionTitle id="artigos-autor">Artigos ({total})</SectionTitle>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-muted">Nenhum artigo publicado ainda.</p>
        ) : (
          rows.map((a) => <ArticleRow key={a.id} article={a} />)
        )}
        <Pagination page={page} pages={pages} href={(p) => `/autores/${profile.username}${p > 1 ? `?pagina=${p}` : ""}`} />
      </section>
    </div>
  );
}
