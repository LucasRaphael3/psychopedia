import type { Metadata } from "next";
import { ArticleRow } from "@/components/article-card";
import { Pagination, parsePage } from "@/components/pagination";
import { submitSearch } from "@/features/articles/actions";
import { getSearchTerm, searchArticles } from "@/features/articles/queries";

export const metadata: Metadata = { title: "Buscar" };

export default async function SearchPage({ searchParams }: PageProps<"/busca">) {
  const term = await getSearchTerm();
  const page = parsePage((await searchParams).pagina);
  const result = term ? await searchArticles(term, page) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-serif text-4xl font-bold">Buscar artigos</h1>
      <form action={submitSearch} role="search" className="mt-6 flex gap-2">
        <label htmlFor="q" className="sr-only">Termo de busca</label>
        <input id="q" name="q" type="search" defaultValue={term} placeholder="Ex.: ansiedade, apego, burnout" className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 focus:border-brand focus:outline-none" />
        <button type="submit" className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-strong">Buscar</button>
      </form>
      {result && (
        <>
          <p className="mt-6 text-sm text-muted" aria-live="polite">{result.total} resultado(s) para “{term}”</p>
          {result.rows.map((a) => <ArticleRow key={a.id} article={a} />)}
          <Pagination page={page} pages={result.pages} href={(p) => `/busca?pagina=${p}`} />
        </>
      )}
    </div>
  );
}
