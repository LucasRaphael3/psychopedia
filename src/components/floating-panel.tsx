"use client";

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  /** Element the panel is attached to; clicks on it are left to its own toggle handler. */
  anchor: HTMLElement;
  label: string;
  onClose: () => void;
  /** Move focus into the panel (when it was opened from the keyboard). */
  focusOnOpen?: boolean;
  children: ReactNode;
};

const MARGIN = 8;

/**
 * A small dialog rendered in a portal with fixed positioning, so scrollable containers don't clip it.
 * Prefers the space above the anchor, flips below when needed and stays inside the viewport.
 * Closes on outside click, Escape (returning focus to the anchor) and when focus leaves it.
 */
export function FloatingPanel({ anchor, label, onClose, focusOnOpen = false, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    function place() {
      if (!panel) return;
      const a = anchor.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      const above = a.top - p.height - MARGIN;
      const top = above >= MARGIN ? above : Math.min(a.bottom + MARGIN, window.innerHeight - p.height - MARGIN);
      const left = Math.min(Math.max(a.left + a.width / 2 - p.width / 2, MARGIN), window.innerWidth - p.width - MARGIN);
      setPosition({ top: Math.max(top, MARGIN), left: Math.max(left, MARGIN) });
    }
    // Follow the anchor when the page or the message list scrolls (scrolling inside the panel doesn't move it).
    function onScroll(event: Event) {
      if (!panel?.contains(event.target as Node)) place();
    }
    place();
    const observer = new ResizeObserver(place);
    observer.observe(panel);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [anchor]);

  const placed = position !== null;
  useEffect(() => {
    // Wait until the panel is positioned (visible), otherwise focus() is ignored.
    if (focusOnOpen && placed) ref.current?.querySelector<HTMLElement>("[tabindex='0'], button")?.focus();
  }, [focusOnOpen, placed]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (ref.current?.contains(target) || anchor.contains(target)) return;
      onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
      anchor.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && !event.currentTarget.contains(next) && !anchor.contains(next)) onClose();
      }}
      style={{ top: position?.top ?? 0, left: position?.left ?? 0, visibility: position ? "visible" : "hidden" }}
      className="fixed z-50 rounded-2xl border border-border bg-surface shadow-lg"
    >
      {children}
    </div>,
    document.body,
  );
}
