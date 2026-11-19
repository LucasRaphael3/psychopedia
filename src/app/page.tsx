import Link from "next/link";
import { ArticleCompact, ArticleRow, FeaturedArticle } from "@/components/article-card";
import { Avatar } from "@/components/avatar";
import { Pagination, parsePage, SectionTitle } from "@/components/pagination";
import { getCurrentUser } from "@/features/auth/session";
import { listLatest, listTopAuthors } from "@/features/articles/queries";
import { CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

const ESSENTIALS = 4;

export default async function Home({ searchParams }: PageProps<"/">) {
  const page = parsePage((await searchParams).pagina);
  const [{ rows, pages }, authors, user] = await Promise.all([listLatest(page), listTopAuthors(), getCurrentUser()]);

  if (rows.length === 0) return <EmptyHome loggedIn={Boolean(user)} />;

  const firstPage = page === 1;
  const [featured, ...rest] = rows;
  const essentials = firstPage ? rest.slice(0, ESSENTIALS) : [];
  const latest = firstPage ? rest.slice(ESSENTIALS) : rows;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {firstPage && featured && (
        <section aria-label="Destaque" className="border-b border-border pb-10">
          <FeaturedArticle article={featured} />
        </section>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
        <div>
          {essentials.length > 0 && (
            <section aria-labelledby="essenciais" className="mb-12">
              <SectionTitle id="essenciais">Essenciais de hoje</SectionTitle>
              <div className="grid gap-x-8 sm:grid-cols-2">
                {essentials.map((a) => <ArticleCompact key={a.id} article={a} />)}
              </div>
            </section>
          )}
          <section aria-labelledby="recentes">
            <SectionTitle id="recentes">Mais recentes</SectionTitle>
            {latest.map((a) => <ArticleRow key={a.id} article={a} />)}
            <Pagination page={page} pages={pages} href={(p) => (p === 1 ? "/" : `/?pagina=${p}`)} />
          </section>
        </div>

        <aside className="space-y-10">
          {!user && (
            <div className="rounded-xl bg-brand p-6 text-white">
              <h2 className="font-serif text-2xl font-bold">Faça parte da conversa</h2>
              <p className="mt-2 text-sm text-white/85">Publique artigos, compartilhe leituras e converse com outros leitores.</p>
              <Link href="/cadastro" className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">
                Criar conta grátis
              </Link>
            </div>
          )}
          {authors.length > 0 && (
            <section aria-labelledby="autores">
              <SectionTitle id="autores">Autores em destaque</SectionTitle>
              <ul>
                {authors.map((a) => (
                  <li key={a.username} className="flex gap-3 border-b border-border py-4 last:border-b-0">
                    <Avatar name={a.name} seed={a.username} />
                    <div className="min-w-0">
                      <Link href={`/autores/${a.username}`} className="font-semibold hover:underline">{a.name}</Link>
                      <p className="line-clamp-2 text-sm text-muted">{a.bio || `${a.total} artigo(s) publicado(s)`}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <CategoryList />
        </aside>
      </div>
    </div>
  );
}

function CategoryList() {
  return (
    <section aria-labelledby="temas">
      <SectionTitle id="temas">Explore por tema</SectionTitle>
      <ul className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link href={`/categorias/${c.slug}`} className="block rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-brand hover:text-brand">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyHome({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-serif text-4xl font-bold">Bem-vindo à Psychopedia</h1>
      <p className="mt-4 text-lg text-muted">Ainda não há artigos publicados. Que tal escrever o primeiro?</p>
      <Link href={loggedIn ? "/publicar" : "/cadastro"} className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white hover:opacity-90">
        {loggedIn ? "Publicar artigo" : "Criar conta e publicar"}
      </Link>
      <div className="mt-16 text-left"><CategoryList /></div>
    </div>
  );
}
