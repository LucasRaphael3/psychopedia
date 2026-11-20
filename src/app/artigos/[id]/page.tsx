import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleCompact } from "@/components/article-card";
import { Avatar } from "@/components/avatar";
import { CategoryArt } from "@/components/category-art";
import { SectionTitle } from "@/components/pagination";
import { getArticle, listRelated } from "@/features/articles/queries";
import { categoryName } from "@/lib/categories";
import { formatDate, readingMinutes } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/artigos/[id]">): Promise<Metadata> {
  const article = await getArticle((await params).id);
  return article ? { title: article.title, description: article.summary } : { title: "Artigo não encontrado" };
}

/** Plain-text body: blank lines split paragraphs and "## " starts a subheading. */
function ArticleBody({ content }: { content: string }) {
  const blocks = content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="prose-article">
      {blocks.map((block, i) =>
        block.startsWith("## ") ? <h2 key={i}>{block.slice(3)}</h2> : <p key={i}>{block}</p>,
      )}
    </div>
  );
}

export default async function ArticlePage({ params }: PageProps<"/artigos/[id]">) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();
  if (article.id !== id) permanentRedirect(`/artigos/${article.id}`);
  const related = await listRelated(article.category, article.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
        <article className="min-w-0">
          <Link href={`/categorias/${article.category}`} className="text-sm font-bold uppercase tracking-wider text-accent hover:underline">
            {categoryName(article.category)}
          </Link>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight md:text-5xl">{article.title}</h1>
          <p className="mt-4 text-xl leading-relaxed text-muted">{article.summary}</p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
            <div className="flex items-center gap-3">
              <Avatar name={article.authorName} seed={article.authorUsername} />
              <div>
                <Link href={`/autores/${article.authorUsername}`} className="font-semibold hover:underline">{article.authorName}</Link>
                <p className="text-sm text-muted">
                  <time dateTime={article.createdAt.toISOString()}>{formatDate(article.createdAt)}</time> · {readingMinutes(article.content)} min de leitura
                </p>
              </div>
            </div>
            <Link
              href={`/artigos/${article.id}/compartilhar`}
              className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"
            >
              Compartilhar no chat
            </Link>
          </div>

          <CategoryArt category={article.category} className="my-8 aspect-[21/9] w-full" />
          <ArticleBody content={article.content} />

          {article.sourceUrl && (
            <p className="mt-8 rounded-lg bg-brand-soft px-4 py-3 text-sm">
              Fonte / leitura original:{" "}
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer nofollow ugc" className="break-all font-medium text-brand underline">
                {article.sourceUrl}
              </a>
            </p>
          )}

          <div className="mt-10 flex gap-4 rounded-xl border border-border bg-surface p-6">
            <Avatar name={article.authorName} seed={article.authorUsername} size="lg" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Sobre o autor</p>
              <Link href={`/autores/${article.authorUsername}`} className="font-serif text-xl font-bold hover:underline">{article.authorName}</Link>
              <p className="mt-1 text-muted">{article.authorBio || "Membro da comunidade Psychopedia."}</p>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <aside aria-labelledby="relacionados">
            <SectionTitle id="relacionados">Leia também</SectionTitle>
            {related.map((a) => <ArticleCompact key={a.id} article={a} />)}
          </aside>
        )}
      </div>
    </div>
  );
}
