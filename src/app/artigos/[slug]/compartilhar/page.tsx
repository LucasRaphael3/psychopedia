import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/features/articles/queries";
import { requireUser } from "@/features/auth/session";
import { listConversations } from "@/features/chat/queries";
import { ShareForm } from "@/features/chat/share-form";

export const metadata: Metadata = { title: "Compartilhar artigo" };

export default async function SharePage({ params }: PageProps<"/artigos/[slug]/compartilhar">) {
  const { slug } = await params;
  const user = await requireUser(`/artigos/${slug}/compartilhar`);
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const contacts = (await listConversations(user.id)).map((c) => c.other);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-serif text-3xl font-bold">Compartilhar no chat</h1>
      <div className="my-6 rounded-lg border-l-4 border-accent bg-surface p-4">
        <Link href={`/artigos/${slug}`} className="font-serif text-lg font-bold hover:underline">{article.title}</Link>
        <p className="mt-1 text-sm text-muted">{article.summary}</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6">
        <ShareForm slug={slug} contacts={contacts} />
      </div>
    </div>
  );
}
