"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FloatingPanel } from "@/components/floating-panel";
import { cn } from "@/lib/utils";
import { createVideoUpload, sendImageMessage, sendMessage, sendVideoMessage } from "./actions";
import { EmojiPicker } from "./emoji-picker";
import { type PreparedImage, prepareImage } from "./prepare-image";
import { type PreparedVideo, prepareVideo, uploadVideo } from "./prepare-video";
import type { ChatMessage } from "./queries";

const MAX_LENGTH = 2000;
/** How often the "typing…" signal is refreshed while the person types (the server keeps it for 6 s). */
const TYPING_PING_MS = 2500;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm";

type Attachment = (PreparedImage & { kind: "image"; previewUrl: string }) | (PreparedVideo & { kind: "video" });
type SendResult = { ok: true; message: ChatMessage } | { ok: false; error: string };
type Props = { conversationId: string; onSent: (message: ChatMessage) => void };

function signalTyping(conversationId: string, typing: boolean) {
  void fetch(`/api/conversations/${conversationId}/typing`, { method: typing ? "POST" : "DELETE", keepalive: true }).catch(() => undefined);
}

function formatMegabytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

const iconButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted hover:border-brand hover:text-brand";

export function Composer({ conversationId, onSent }: Props) {
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ anchor: HTMLElement; focus: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const typingRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Release the preview object URL when the attachment changes or the composer unmounts.
  useEffect(() => () => {
    if (attachment) URL.revokeObjectURL(attachment.previewUrl);
  }, [attachment]);

  // Leaving the conversation ends the "typing…" signal and any upload in progress.
  useEffect(() => {
    const typing = typingRef;
    const abort = abortRef;
    return () => {
      if (typing.current) signalTyping(conversationId, false);
      abort.current?.abort();
    };
  }, [conversationId]);

  const closePicker = useCallback(() => setPicker(null), []);

  function updateDraft(value: string) {
    setDraft(value);
    if (!value.trim()) {
      if (typingRef.current) signalTyping(conversationId, false);
      typingRef.current = 0;
      return;
    }
    const now = Date.now();
    if (now - typingRef.current < TYPING_PING_MS) return;
    typingRef.current = now;
    signalTyping(conversationId, true);
  }

  function insertEmoji(emoji: string) {
    const el = textRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    if (next.length > MAX_LENGTH) return;
    updateDraft(next);
    const caret = start + emoji.length;
    requestAnimationFrame(() => el?.setSelectionRange(caret, caret));
  }

  async function pickFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPreparing(true);
    try {
      if (file.type.startsWith("video/")) {
        setAttachment({ kind: "video", ...(await prepareVideo(file)) });
      } else {
        const image = await prepareImage(file);
        setAttachment({ kind: "image", ...image, previewUrl: URL.createObjectURL(image.blob) });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPreparing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function sendImage(image: PreparedImage, caption: string) {
    const form = new FormData();
    form.set("conversationId", conversationId);
    form.set("caption", caption);
    form.set("width", String(image.width));
    form.set("height", String(image.height));
    form.set("image", image.blob, "foto.jpg");
    return sendImageMessage(form);
  }

  async function sendVideo(video: PreparedVideo, caption: string): Promise<SendResult> {
    const ticket = await createVideoUpload({ conversationId, contentType: video.type, size: video.file.size });
    if (!ticket.ok) return ticket;
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    try {
      await uploadVideo(ticket.uploadUrl, video.file, setProgress, controller.signal);
    } finally {
      abortRef.current = null;
    }
    return sendVideoMessage({ conversationId, path: ticket.path, caption, width: video.width, height: video.height });
  }

  async function submit() {
    const body = draft.trim();
    if ((!body && !attachment) || sending || preparing) return;
    setError(null);
    setSending(true);
    try {
      const result =
        attachment?.kind === "video"
          ? await sendVideo(attachment, body)
          : attachment?.kind === "image"
            ? await sendImage(attachment, body)
            : await sendMessage({ conversationId, body });
      if (result.ok) {
        setDraft("");
        setAttachment(null);
        typingRef.current = 0; // the server clears the signal when the message is stored
        onSent(result.message);
      } else {
        setError(result.error);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Não foi possível enviar. Verifique a conexão e tente novamente.");
    } finally {
      setSending(false);
      setProgress(null);
    }
  }

  const busy = sending || preparing;
  const canSend = (Boolean(draft.trim()) || Boolean(attachment)) && !busy;

  return (
    <form
      className="border-t border-border pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {error && <p role="alert" className="mb-2 text-sm text-accent">{error}</p>}
      {(attachment || preparing) && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface p-2">
          {attachment?.kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimizable
            <img src={attachment.previewUrl} alt="Prévia da foto selecionada" className="h-16 w-16 rounded-lg object-cover" />
          )}
          {attachment?.kind === "video" && (
            <video src={attachment.previewUrl} muted playsInline preload="metadata" aria-label="Prévia do vídeo selecionado" className="h-16 w-16 rounded-lg bg-black object-cover" />
          )}
          {!attachment && <div className="h-16 w-16 animate-pulse rounded-lg bg-brand-soft" aria-hidden="true" />}
          <div className="min-w-0 flex-1 text-sm text-muted">
            {progress !== null ? (
              <>
                <p aria-live="polite">Enviando vídeo… {Math.round(progress * 100)}%</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-soft" aria-hidden="true">
                  <div className="h-full bg-brand transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
              </>
            ) : preparing ? (
              <p>Preparando arquivo…</p>
            ) : attachment?.kind === "video" ? (
              <>
                <p>Vídeo pronto ({formatMegabytes(attachment.file.size)}). Adicione uma legenda, se quiser.</p>
                <p className="mt-0.5 text-xs">O vídeo é enviado como está: metadados (como localização) não são removidos.</p>
              </>
            ) : (
              <p>Foto pronta. Adicione uma legenda, se quiser.</p>
            )}
          </div>
          {progress !== null ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="rounded-full px-3 py-1.5 text-sm hover:bg-brand-soft">
              Cancelar
            </button>
          ) : (
            attachment &&
            !sending && (
              <button type="button" onClick={() => setAttachment(null)} className="rounded-full px-3 py-1.5 text-sm hover:bg-brand-soft">
                Remover
              </button>
            )
          )}
        </div>
      )}
      <div className="flex items-end gap-1.5 sm:gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          id="anexo"
          disabled={busy}
          onChange={(e) => void pickFile(e.target.files?.[0])}
        />
        <label htmlFor="anexo" title="Anexar foto ou vídeo" className={cn(iconButton, "cursor-pointer", busy && "pointer-events-none opacity-50")}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="m21 11.5-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9" />
          </svg>
          <span className="sr-only">Anexar foto ou vídeo</span>
        </label>
        <button
          type="button"
          title="Emojis"
          aria-label="Emojis"
          aria-haspopup="dialog"
          aria-expanded={Boolean(picker)}
          // Keep the caret in the message box while the picker is open.
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            const anchor = e.currentTarget;
            setPicker((open) => (open ? null : { anchor, focus: e.detail === 0 }));
          }}
          className={cn(iconButton, picker && "border-brand text-brand")}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" />
          </svg>
        </button>
        <label htmlFor="mensagem" className="sr-only">Mensagem</label>
        <textarea
          ref={textRef}
          id="mensagem"
          rows={1}
          maxLength={MAX_LENGTH}
          value={draft}
          onChange={(e) => updateDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={attachment ? "Legenda…" : "Mensagem…"}
          className="max-h-40 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-border bg-surface px-3 py-2.5 focus:border-brand sm:px-4 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand font-semibold text-white hover:bg-brand-strong disabled:opacity-50 sm:w-auto sm:px-5"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 sm:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12 20 4l-4 16-4-7-8-1Z" />
          </svg>
          <span className="sr-only sm:not-sr-only">{sending ? "Enviando…" : "Enviar"}</span>
        </button>
      </div>
      {picker && (
        <FloatingPanel anchor={picker.anchor} label="Emojis" focusOnOpen={picker.focus} onClose={closePicker}>
          <EmojiPicker onSelect={insertEmoji} />
        </FloatingPanel>
      )}
    </form>
  );
}
