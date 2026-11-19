import Link from "next/link";
import type { ArticleCard as Card } from "@/features/articles/queries";
import { categoryName } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { CategoryArt } from "./category-art";

function Byline({ article }: { article: Card }) {
  return (
    <p className="text-sm text-muted">
      <Link href={`/autores/${article.authorUsername}`} className="font-medium text-foreground hover:underline">
        {article.authorName}
      </Link>{" "}
      em <time dateTime={article.createdAt.toISOString()}>{formatDate(article.createdAt)}</time>
    </p>
  );
}

function Topic({ category }: { category: string }) {
  return (
    <Link href={`/categorias/${category}`} className="text-xs font-bold uppercase tracking-wider text-accent hover:underline">
      {categoryName(category)}
    </Link>
  );
}

export function FeaturedArticle({ article }: { article: Card }) {
  return (
    <article className="grid gap-6 md:grid-cols-2">
      <CategoryArt category={article.category} className="aspect-[4/3] w-full" />
      <div className="flex flex-col justify-center">
        <Topic category={article.category} />
        <h2 className="mt-2 font-serif text-3xl font-bold leading-tight md:text-4xl">
          <Link href={`/artigos/${article.slug}`} className="hover:text-brand">{article.title}</Link>
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">{article.summary}</p>
        <div className="mt-4"><Byline article={article} /></div>
      </div>
    </article>
  );
}

export function ArticleRow({ article }: { article: Card }) {
  return (
    <article className="flex gap-4 border-b border-border py-6 last:border-b-0 sm:gap-6">
      <Link href={`/artigos/${article.slug}`} tabIndex={-1} aria-hidden="true" className="shrink-0">
        <CategoryArt category={article.category} className="h-24 w-24 sm:h-36 sm:w-36" />
      </Link>
      <div className="min-w-0">
        <Topic category={article.category} />
        <h3 className="mt-1 font-serif text-xl font-bold leading-snug sm:text-2xl">
          <Link href={`/artigos/${article.slug}`} className="hover:text-brand">{article.title}</Link>
        </h3>
        <div className="mt-1"><Byline article={article} /></div>
        <p className="mt-2 hidden leading-relaxed text-muted sm:block">{article.summary}</p>
      </div>
    </article>
  );
}

export function ArticleCompact({ article }: { article: Card }) {
  return (
    <article className="border-b border-border py-4 last:border-b-0">
      <Topic category={article.category} />
      <h3 className="mt-1 font-serif text-lg font-bold leading-snug">
        <Link href={`/artigos/${article.slug}`} className="hover:text-brand">{article.title}</Link>
      </h3>
      <p className="mt-1 text-sm text-muted">{article.authorName}</p>
    </article>
  );
}
