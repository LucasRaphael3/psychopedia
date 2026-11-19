import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Avatar } from "@/components/avatar";
import { requireUser } from "@/features/auth/session";
import { ChatRoom } from "@/features/chat/chat-room";
import { getConversationForUser, listMessages, markConversationRead } from "@/features/chat/queries";

export const metadata: Metadata = { title: "Conversa" };

export default async function ConversationPage({ params }: PageProps<"/mensagens/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/mensagens/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();
  const conversation = await getConversationForUser(id, user.id);
  if (!conversation) notFound();

  const messages = await listMessages(conversation.id);
  await markConversationRead(conversation.id, user.id);

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl flex-col px-4 py-6">
      <header className="flex items-center gap-3 border-b border-border pb-4">
        <Link href="/mensagens" className="rounded-full px-2 py-1 text-sm text-muted hover:bg-brand-soft" aria-label="Voltar para mensagens">←</Link>
        <Avatar name={conversation.other.name} seed={conversation.other.username} size="sm" />
        <div>
          <h1 className="font-semibold leading-tight">{conversation.other.name}</h1>
          <Link href={`/autores/${conversation.other.username}`} className="text-xs text-muted hover:underline">@{conversation.other.username}</Link>
        </div>
      </header>
      <ChatRoom conversationId={conversation.id} currentUserId={user.id} initialMessages={messages} />
    </div>
  );
}
