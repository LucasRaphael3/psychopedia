import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { requireUser } from "@/features/auth/session";
import { startConversation } from "@/features/chat/actions";
import { listConversations } from "@/features/chat/queries";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Mensagens" };

export default async function MessagesPage() {
  const user = await requireUser("/mensagens");
  const conversations = await listConversations(user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-4xl font-bold">Mensagens</h1>

      <form action={startConversation} className="mt-6 flex gap-2">
        <label htmlFor="nova-conversa" className="sr-only">Nome de usuário</label>
        <input
          id="nova-conversa"
          name="username"
          required
          placeholder="Iniciar conversa com @usuario"
          className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 focus:border-brand focus:outline-none"
        />
        <button type="submit" className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-strong">Conversar</button>
      </form>

      {conversations.length === 0 ? (
        <div className="mt-12 text-center text-muted">
          <p>Você ainda não tem conversas.</p>
          <p className="mt-1 text-sm">Abra o perfil de um autor e clique em “Enviar mensagem”, ou compartilhe um artigo.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/mensagens/${c.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-brand-soft">
                <Avatar name={c.other.name} seed={c.other.username} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={c.unread ? "font-bold" : "font-semibold"}>{c.other.name}</p>
                    <time dateTime={c.updatedAt.toISOString()} className="shrink-0 text-xs text-muted">{relativeTime(c.updatedAt)}</time>
                  </div>
                  <p className={`truncate text-sm ${c.unread ? "font-medium text-foreground" : "text-muted"}`}>{c.lastMessage || "Nenhuma mensagem ainda"}</p>
                </div>
                {c.unread > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
                    {c.unread}<span className="sr-only"> não lidas</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
