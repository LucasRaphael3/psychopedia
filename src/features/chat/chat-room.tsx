"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { sendImageMessage, sendMessage } from "./actions";
import { type PreparedImage, prepareImage } from "./prepare-image";
import type { ChatMessage } from "./queries";

const POLL_MS = 3000;

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  if (incoming.length === 0) return current;
  const seen = new Set(current.map((m) => m.id));
  const fresh = incoming.filter((m) => !seen.has(m.id));
  return fresh.length ? [...current, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : current;
}

type Attachment = PreparedImage & { previewUrl: string };
type Props = { conversationId: string; currentUserId: string; initialMessages: ChatMessage[] };

export function ChatRoom({ conversationId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef(initialMessages.at(-1)?.createdAt);

  useEffect(() => {
    lastRef.current = messages.at(-1)?.createdAt;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Release the preview object URL when the attachment changes or the room unmounts.
  useEffect(() => () => {
    if (attachment) URL.revokeObjectURL(attachment.previewUrl);
  }, [attachment]);

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

  async function pickImage(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPreparing(true);
    try {
      const prepared = await prepareImage(file);
      setAttachment({ ...prepared, previewUrl: URL.createObjectURL(prepared.blob) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPreparing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submit() {
    const body = draft.trim();
    if ((!body && !attachment) || pending || preparing) return;
    setError(null);
    startTransition(async () => {
      let result;
      if (attachment) {
        const form = new FormData();
        form.set("conversationId", conversationId);
        form.set("caption", body);
        form.set("width", String(attachment.width));
        form.set("height", String(attachment.height));
        form.set("image", attachment.blob, "foto.jpg");
        result = await sendImageMessage(form).catch(() => ({ ok: false as const, error: "Não foi possível enviar a foto." }));
      } else {
        result = await sendMessage({ conversationId, body });
      }
      if (result.ok) {
        setDraft("");
        setAttachment(null);
        setMessages((current) => mergeMessages(current, [result.message]));
      } else {
        setError(result.error);
      }
    });
  }

  const canSend = (Boolean(draft.trim()) || Boolean(attachment)) && !pending && !preparing;

  return (
    <>
      <div className="flex-1 overflow-y-auto py-4" aria-live="polite" aria-label="Mensagens da conversa">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">Diga olá! 👋</p>}
        <ul className="space-y-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} mine={m.senderId === currentUserId} />
          ))}
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
        {(attachment || preparing) && (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface p-2">
            {attachment ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimizable
              <img src={attachment.previewUrl} alt="Prévia da foto selecionada" className="h-16 w-16 rounded-lg object-cover" />
            ) : (
              <div className="h-16 w-16 animate-pulse rounded-lg bg-brand-soft" aria-hidden="true" />
            )}
            <p className="flex-1 text-sm text-muted">{preparing ? "Preparando foto…" : "Foto pronta. Adicione uma legenda, se quiser."}</p>
            {attachment && (
              <button type="button" onClick={() => setAttachment(null)} className="rounded-full px-3 py-1.5 text-sm hover:bg-brand-soft">
                Remover
              </button>
            )}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            id="foto"
            onChange={(e) => void pickImage(e.target.files?.[0])}
          />
          <label
            htmlFor="foto"
            title="Anexar foto"
            className={cn(
              "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-muted hover:border-brand hover:text-brand",
              (pending || preparing) && "pointer-events-none opacity-50",
            )}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="m21 16-5-5-8 8" />
            </svg>
            <span className="sr-only">Anexar foto</span>
          </label>
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
            placeholder={attachment ? "Legenda (opcional)…" : "Escreva uma mensagem…"}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-surface px-4 py-2.5 focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
          >
            {pending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>
    </>
  );
}

function MessageBubble({ message: m, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <li className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5", mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm border border-border bg-surface")}>
        {m.image && (
          <a href={m.image.url} target="_blank" rel="noopener" className="-mx-2 mb-2 block first:-mt-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- auth-gated API image, not optimizable */}
            <img
              src={m.image.url}
              width={m.image.width}
              height={m.image.height}
              loading="lazy"
              alt={m.body ? `Foto: ${m.body}` : "Foto enviada na conversa"}
              className="h-auto max-h-80 w-auto max-w-full rounded-xl"
            />
          </a>
        )}
        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
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
}
