"use client";

import Link from "next/link";
import { memo } from "react";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { groupReactions } from "./chat-state";
import type { ChatMessage } from "./queries";

type Props = {
  message: ChatMessage;
  currentUserId: string;
  otherName: string;
  /** The reaction picker is open for this message. */
  reacting: boolean;
  onOpenReactions: (messageId: string, anchor: HTMLElement, viaKeyboard: boolean) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
};

function describe(userIds: string[], currentUserId: string, otherName: string) {
  return userIds.map((id) => (id === currentUserId ? "Você" : otherName)).join(" e ");
}

export const MessageBubble = memo(function MessageBubble({ message: m, currentUserId, otherName, reacting, onOpenReactions, onToggleReaction }: Props) {
  const mine = m.senderId === currentUserId;
  const groups = groupReactions(m.reactions);

  return (
    <li className={cn("group flex items-center gap-1.5", mine ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("flex min-w-0 max-w-[80%] flex-col", mine ? "items-end" : "items-start")}>
        <div className={cn("max-w-full rounded-2xl px-4 py-2.5", mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm border border-border bg-surface")}>
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
          {m.video && (
            <div className="-mx-2 mb-2 first:-mt-0.5">
              {/* #t=0.1 makes Safari paint the first frame instead of a blank box. */}
              <video
                src={`${m.video.url}#t=0.1`}
                width={m.video.width}
                height={m.video.height}
                controls
                playsInline
                preload="metadata"
                aria-label={m.body ? `Vídeo: ${m.body}` : "Vídeo enviado na conversa"}
                className="block h-auto max-h-80 w-auto max-w-full rounded-xl bg-black"
              />
            </div>
          )}
          {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
          {m.article && (
            <Link
              href={`/artigos/${m.article.id}`}
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

        {groups.length > 0 && (
          <div className="relative -mt-1.5 flex flex-wrap gap-1 px-2">
            {groups.map(({ emoji, userIds }) => {
              const who = describe(userIds, currentUserId, otherName);
              const pressed = userIds.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  type="button"
                  aria-pressed={pressed}
                  aria-label={`Reação ${emoji}: ${who}`}
                  title={who}
                  onClick={() => onToggleReaction(m.id, emoji)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-sm leading-none shadow-sm",
                    pressed ? "border-brand bg-brand-soft" : "border-border bg-surface hover:border-brand",
                  )}
                >
                  <span aria-hidden="true">{emoji}</span>
                  {userIds.length > 1 && <span className="text-xs font-semibold text-muted" aria-hidden="true">{userIds.length}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="Reagir à mensagem"
        title="Reagir"
        aria-haspopup="dialog"
        aria-expanded={reacting}
        onClick={(e) => onOpenReactions(m.id, e.currentTarget, e.detail === 0)}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-opacity hover:bg-brand-soft hover:text-brand focus-visible:opacity-100",
          reacting ? "bg-brand-soft text-brand opacity-100" : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-60",
        )}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M20.5 11.5a8.5 8.5 0 1 1-8-8M8.5 14a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01M19 2v5M16.5 4.5h5" />
        </svg>
      </button>
    </li>
  );
});
