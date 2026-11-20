"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { EMOJI_CATEGORIES, type EmojiCategory, isAllowedEmoji, QUICK_REACTIONS } from "./emoji-data";

const RECENT_KEY = "psy_emoji_recentes";
const RECENT_MAX = 24;
const COLUMNS = 8;

// Recently used emojis are a per-device convenience; storage may be unavailable (private mode).
function readRecents(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((e): e is string => typeof e === "string" && isAllowedEmoji(e)).slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function rememberRecent(emoji: string) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([emoji, ...readRecents().filter((e) => e !== emoji)].slice(0, RECENT_MAX)));
  } catch {
    // Not persisted; the picker still works.
  }
}

const KEY_STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLUMNS, ArrowUp: -COLUMNS };

/** Arrow keys move between emojis; only the first one is in the Tab order (roving focus). */
function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
  const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button")];
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (index < 0) return;
  const step = event.key === "Home" ? -index : event.key === "End" ? buttons.length - 1 - index : KEY_STEPS[event.key];
  if (step === undefined) return;
  event.preventDefault();
  buttons[Math.min(Math.max(index + step, 0), buttons.length - 1)]?.focus();
}

type PickerProps = { onSelect: (emoji: string) => void; autoFocus?: boolean };

export function EmojiPicker({ onSelect, autoFocus = false }: PickerProps) {
  const id = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  // Read once per opening so the "Recentes" grid doesn't reshuffle under the pointer.
  const [recents] = useState(readRecents);
  const tabs: readonly EmojiCategory[] = recents.length
    ? [{ id: "recentes", label: "Recentes", icon: "🕘", emojis: recents }, ...EMOJI_CATEGORIES]
    : EMOJI_CATEGORIES;
  const [active, setActive] = useState(tabs[0].id);
  const category = tabs.find((t) => t.id === active) ?? tabs[0];

  useEffect(() => {
    if (autoFocus) gridRef.current?.querySelector("button")?.focus();
  }, [autoFocus]);

  return (
    // Mouse clicks don't take focus, so the message box keeps its caret and the keyboard stays open on phones.
    <div className="w-[min(20rem,calc(100vw-1rem))]" onMouseDown={(e) => e.preventDefault()}>
      <div role="tablist" aria-label="Categorias de emoji" className="flex gap-0.5 overflow-x-auto border-b border-border p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${id}-${tab.id}`}
            aria-selected={tab.id === category.id}
            aria-controls={`${id}-painel`}
            aria-label={tab.label}
            title={tab.label}
            onClick={() => {
              setActive(tab.id);
              gridRef.current?.scrollTo({ top: 0 });
            }}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl",
              tab.id === category.id ? "bg-brand-soft" : "opacity-70 hover:bg-brand-soft hover:opacity-100",
            )}
          >
            {tab.icon}
          </button>
        ))}
      </div>
      <p className="px-3 pt-2 text-xs font-semibold text-muted">{category.label}</p>
      <div
        ref={gridRef}
        role="tabpanel"
        id={`${id}-painel`}
        aria-labelledby={`${id}-${category.id}`}
        onKeyDown={moveFocus}
        className="grid max-h-56 grid-cols-8 gap-0.5 overflow-y-auto p-2"
      >
        {category.emojis.map((emoji, index) => (
          <button
            key={emoji}
            type="button"
            tabIndex={index === 0 ? 0 : -1}
            onClick={() => {
              rememberRecent(emoji);
              onSelect(emoji);
            }}
            className="flex aspect-square items-center justify-center rounded-lg text-2xl leading-none hover:bg-brand-soft focus-visible:bg-brand-soft"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Quick reaction bar with a "+" that expands into the full picker. */
export function ReactionPicker({ current, onPick }: { current?: string; onPick: (emoji: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  if (expanded) return <EmojiPicker onSelect={onPick} autoFocus />;
  return (
    <div role="group" aria-label="Reações rápidas" className="flex items-center gap-0.5 p-1.5">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          aria-pressed={current === emoji}
          onClick={() => onPick(emoji)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none hover:bg-brand-soft",
            current === emoji && "bg-brand-soft ring-2 ring-brand/30",
          )}
        >
          {emoji}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Mais emojis"
        title="Mais emojis"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-xl text-muted hover:border-brand hover:text-brand"
      >
        +
      </button>
    </div>
  );
}
