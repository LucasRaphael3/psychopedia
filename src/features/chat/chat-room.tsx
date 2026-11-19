"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { sendMessage } from "./actions";
import type { ChatMessage } from "./queries";

const POLL_MS = 3000;

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  if (incoming.length === 0) return current;
  const seen = new Set(current.map((m) => m.id));
  const fresh = incoming.filter((m) => !seen.has(m.id));
  return fresh.length ? [...current, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : current;
}

type Props = { conversationId: string; currentUserId: string; initialMessages: ChatMessage[] };

export function ChatRoom({ conversationId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef(initialMessages.at(-1)?.createdAt);

  useEffect(() => {
    lastRef.current = messages.at(-1)?.createdAt;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const poll = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    const after = lastRef.current ? `?after=${encodeURIComponent(lastRef.current)}` : "";
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages${after}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: ChatMessage[] };
      setMessages((current) => mergeMessages(current, data.messages));
    } catch {
      // Network hiccup: the next tick retries.
    }
  }, [conversationId]);

  useEffect(() => {
    const timer = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  function submit() {
    const body = draft.trim();
    if (!body || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await sendMessage({ conversationId, body });
      if (result.ok) {
        setDraft("");
        setMessages((current) => mergeMessages(current, [result.message]));
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto py-4" aria-live="polite" aria-label="Mensagens da conversa">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">Diga olá! 👋</p>}
        <ul className="space-y-3">
          {messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5", mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm border border-border bg-surface")}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  {m.article && (
                    <Link
                      href={`/artigos/${m.article.slug}`}
                      className={cn("mt-2 block rounded-lg border-l-4 border-accent p-3", mine ? "bg-white/10 hover:bg-white/20" : "bg-background hover:bg-brand-soft")}
                    >
                      <span className="block font-serif font-bold">{m.article.title}</span>
                      <span className={cn("mt-1 line-clamp-2 block text-sm", mine ? "text-white/80" : "text-muted")}>{m.article.summary}</span>
                    </Link>
                  )}
                  <time dateTime={m.createdAt} suppressHydrationWarning className={cn("mt-1 block text-right text-[11px]", mine ? "text-white/70" : "text-muted")}>
                    {formatTime(new Date(m.createdAt))}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
        <div ref={bottomRef} />
      </div>

      <form
        className="border-t border-border pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {error && <p role="alert" className="mb-2 text-sm text-accent">{error}</p>}
        <div className="flex items-end gap-2">
          <label htmlFor="mensagem" className="sr-only">Mensagem</label>
          <textarea
            id="mensagem"
            rows={1}
            maxLength={2000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Escreva uma mensagem…"
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-surface px-4 py-2.5 focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </form>
    </>
  );
}
