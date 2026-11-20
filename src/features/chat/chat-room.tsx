"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FloatingPanel } from "@/components/floating-panel";
import { toggleReaction } from "./actions";
import { applyReactions, mergeMessages, type ReactionRow, toggleLocalReaction } from "./chat-state";
import { Composer } from "./composer";
import { ReactionPicker } from "./emoji-picker";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage } from "./queries";

const POLL_MS = 3000;
const NEAR_BOTTOM_PX = 120;

type Props = { conversationId: string; currentUserId: string; otherName: string; initialMessages: ChatMessage[] };
type PollResponse = { messages: ChatMessage[]; reactions: ReactionRow[] | null; typing: boolean };
type ReactionTarget = { messageId: string; anchor: HTMLElement; focus: boolean };

export function ChatRoom({ conversationId, currentUserId, otherName, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [otherTyping, setOtherTyping] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<ReactionTarget | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const lastRef = useRef(initialMessages.at(-1)?.createdAt);
  const firstRef = useRef(initialMessages[0]?.createdAt);
  // Bumped on every local reaction change, so a poll that started before it can't overwrite it.
  const reactionVersionRef = useRef(0);

  useEffect(() => {
    lastRef.current = messages.at(-1)?.createdAt;
    firstRef.current = messages[0]?.createdAt;
  }, [messages]);

  // Follow new messages when the reader is already at the bottom or sent it (not on reaction changes).
  const lastId = messages.at(-1)?.id;
  const lastIsMine = messages.at(-1)?.senderId === currentUserId;
  useEffect(() => {
    if (nearBottomRef.current || lastIsMine) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastId, lastIsMine]);

  useEffect(() => {
    if (!reactionError) return;
    const timer = setTimeout(() => setReactionError(null), 4000);
    return () => clearTimeout(timer);
  }, [reactionError]);

  const poll = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    const params = new URLSearchParams();
    if (lastRef.current) params.set("after", lastRef.current);
    const since = firstRef.current;
    if (since) params.set("since", since);
    const version = reactionVersionRef.current;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?${params}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as PollResponse;
      setOtherTyping(data.typing);
      setMessages((current) => {
        const merged = mergeMessages(current, data.messages);
        const fresh = data.reactions && since && version === reactionVersionRef.current;
        return fresh ? applyReactions(merged, data.reactions ?? [], since) : merged;
      });
    } catch {
      // Network hiccup: the next tick retries.
    }
  }, [conversationId]);

  useEffect(() => {
    const timer = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  const onSent = useCallback((message: ChatMessage) => setMessages((current) => mergeMessages(current, [message])), []);

  const openReactions = useCallback((messageId: string, anchor: HTMLElement, focus: boolean) => {
    setReactionTarget((current) => (current?.messageId === messageId ? null : { messageId, anchor, focus }));
  }, []);
  const closeReactions = useCallback(() => setReactionTarget(null), []);

  const applyReaction = useCallback(
    async (messageId: string, emoji: string) => {
      setReactionTarget(null);
      const setFor = (update: (m: ChatMessage) => ChatMessage) =>
        setMessages((current) => current.map((m) => (m.id === messageId ? update(m) : m)));

      reactionVersionRef.current += 1;
      setFor((m) => ({ ...m, reactions: toggleLocalReaction(m.reactions, currentUserId, emoji) }));
      const result = await toggleReaction({ messageId, emoji }).catch(() => ({ ok: false as const, error: "Não foi possível reagir. Tente novamente." }));
      reactionVersionRef.current += 1;
      if (result.ok) setFor((m) => ({ ...m, reactions: result.reactions }));
      else setReactionError(result.error); // the next poll restores the real state
    },
    [currentUserId],
  );
  const react = useCallback((messageId: string, emoji: string) => void applyReaction(messageId, emoji), [applyReaction]);

  const targetMessage = reactionTarget ? messages.find((m) => m.id === reactionTarget.messageId) : undefined;

  return (
    <>
      <div
        className="flex-1 overflow-y-auto py-4"
        aria-live="polite"
        aria-label="Mensagens da conversa"
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
        }}
      >
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">Diga olá! 👋</p>}
        <ul className="space-y-3">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              currentUserId={currentUserId}
              otherName={otherName}
              reacting={reactionTarget?.messageId === m.id}
              onOpenReactions={openReactions}
              onToggleReaction={react}
            />
          ))}
        </ul>
        <div ref={bottomRef} />
      </div>

      {/* Fixed height so the indicator appearing doesn't shift the layout. */}
      <p role="status" className="flex h-6 items-center gap-2 text-xs text-muted">
        {otherTyping && (
          <>
            <span className="flex gap-0.5" aria-hidden="true">
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </span>
            {otherName} está digitando…
          </>
        )}
      </p>
      {reactionError && <p role="alert" className="mb-1 text-sm text-accent">{reactionError}</p>}

      <Composer conversationId={conversationId} onSent={onSent} />

      {reactionTarget && targetMessage && (
        <FloatingPanel anchor={reactionTarget.anchor} label="Reagir à mensagem" focusOnOpen={reactionTarget.focus} onClose={closeReactions}>
          <ReactionPicker
            current={targetMessage.reactions.find((r) => r.userId === currentUserId)?.emoji}
            onPick={(emoji) => react(reactionTarget.messageId, emoji)}
          />
        </FloatingPanel>
      )}
    </>
  );
}
