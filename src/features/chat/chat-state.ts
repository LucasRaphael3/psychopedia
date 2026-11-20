/** Pure helpers for the chat client state (kept out of components so they can be unit tested). */

export type Reaction = { emoji: string; userId: string };
export type ReactionRow = Reaction & { messageId: string };
type Timed = { id: string; createdAt: string; reactions: Reaction[] };

/** Appends unseen messages (deduplicated by id) in chronological order; returns the same array when nothing changed. */
export function mergeMessages<T extends Timed>(current: T[], incoming: T[]) {
  if (incoming.length === 0) return current;
  const seen = new Set(current.map((m) => m.id));
  const fresh = incoming.filter((m) => !seen.has(m.id));
  return fresh.length ? [...current, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : current;
}

function reactionKey(reactions: Reaction[]) {
  return reactions.map((r) => `${r.userId}:${r.emoji}`).sort().join("|");
}

/**
 * Applies a reactions snapshot covering every message created at or after `since`.
 * Messages outside the window keep their reactions; unchanged messages keep their identity.
 */
export function applyReactions<T extends Timed>(messages: T[], rows: ReactionRow[], since: string) {
  const byMessage = new Map<string, Reaction[]>();
  for (const { messageId, emoji, userId } of rows) {
    const list = byMessage.get(messageId) ?? [];
    list.push({ emoji, userId });
    byMessage.set(messageId, list);
  }
  let changed = false;
  const next = messages.map((m) => {
    if (m.createdAt < since) return m;
    const reactions = byMessage.get(m.id) ?? [];
    if (reactionKey(reactions) === reactionKey(m.reactions)) return m;
    changed = true;
    return { ...m, reactions };
  });
  return changed ? next : messages;
}

/** Optimistic toggle with the server's rule: one reaction per person; the same emoji again removes it. */
export function toggleLocalReaction(reactions: Reaction[], userId: string, emoji: string) {
  const mine = reactions.find((r) => r.userId === userId);
  const others = reactions.filter((r) => r.userId !== userId);
  return mine?.emoji === emoji ? others : [...others, { emoji, userId }];
}

/** Groups reactions by emoji, in order of first appearance, for the chips under a message. */
export function groupReactions(reactions: Reaction[]) {
  const groups = new Map<string, string[]>();
  for (const r of reactions) groups.set(r.emoji, [...(groups.get(r.emoji) ?? []), r.userId]);
  return [...groups].map(([emoji, userIds]) => ({ emoji, userIds }));
}
