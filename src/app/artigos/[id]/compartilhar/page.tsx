import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getArticle } from "@/features/articles/queries";
import { requireUser } from "@/features/auth/session";
import { listConversations } from "@/features/chat/queries";
import { ShareForm } from "@/features/chat/share-form";

export const metadata: Metadata = { title: "Compartilhar artigo" };

export default async function SharePage({ params }: PageProps<"/artigos/[id]/compartilhar">) {
  const { id } = await params;
  const user = await requireUser(`/artigos/${id}/compartilhar`);
  const article = await getArticle(id);
  if (!article) notFound();
  if (article.id !== id) permanentRedirect(`/artigos/${article.id}/compartilhar`);
  const contacts = (await listConversations(user.id)).map((c) => c.other);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-serif text-3xl font-bold">Compartilhar no chat</h1>
      <div className="my-6 rounded-lg border-l-4 border-accent bg-surface p-4">
        <Link href={`/artigos/${article.id}`} className="font-serif text-lg font-bold hover:underline">{article.title}</Link>
        <p className="mt-1 text-sm text-muted">{article.summary}</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6">
        <ShareForm articleId={article.id} contacts={contacts} />
      </div>
    </div>
  );
}
