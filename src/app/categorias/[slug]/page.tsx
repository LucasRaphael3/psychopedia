import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleRow } from "@/components/article-card";
import { Pagination, parsePage } from "@/components/pagination";
import { listByCategory } from "@/features/articles/queries";
import { getCategory } from "@/lib/categories";

export async function generateMetadata({ params }: PageProps<"/categorias/[slug]">): Promise<Metadata> {
  const category = getCategory((await params).slug);
  return { title: category?.name ?? "Categoria", description: category?.description };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/categorias/[slug]">) {
  const category = getCategory((await params).slug);
  if (!category) notFound();
  const page = parsePage((await searchParams).pagina);
  const { rows, pages, total } = await listByCategory(category.slug, page);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="border-b-2 border-foreground pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-accent">Tema</p>
        <h1 className="mt-1 font-serif text-4xl font-bold">{category.name}</h1>
        <p className="mt-2 text-lg text-muted">{category.description}</p>
        <p className="mt-2 text-sm text-muted">{total} artigo(s)</p>
      </header>
      {rows.length === 0 ? (
        <p className="py-12 text-center text-muted">Nenhum artigo neste tema ainda.</p>
      ) : (
        rows.map((a) => <ArticleRow key={a.id} article={a} />)
      )}
      <Pagination page={page} pages={pages} href={(p) => `/categorias/${category.slug}${p > 1 ? `?pagina=${p}` : ""}`} />
    </div>
  );
}
