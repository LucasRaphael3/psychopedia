import type { Metadata } from "next";
import { ArticleForm } from "@/features/articles/article-form";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Publicar artigo" };

export default async function PublishPage() {
  await requireUser("/publicar");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-4xl font-bold">Publicar artigo</h1>
      <p className="mb-8 mt-2 text-muted">
        Compartilhe um texto sobre psicologia com a comunidade. Evite dados pessoais de terceiros e cite as fontes.
      </p>
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <ArticleForm />
      </div>
    </div>
  );
}
