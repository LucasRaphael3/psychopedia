import { describe, expect, it } from "vitest";
import { applyReactions, groupReactions, mergeMessages, toggleLocalReaction } from "./chat-state";

const msg = (id: string, createdAt: string, reactions: { emoji: string; userId: string }[] = []) => ({ id, createdAt, reactions });

describe("mergeMessages", () => {
  it("appends unseen messages in order and keeps identity when nothing is new", () => {
    const current = [msg("a", "2026-01-01T10:00:00.000Z")];
    expect(mergeMessages(current, [msg("a", "2026-01-01T10:00:00.000Z")])).toBe(current);
    const merged = mergeMessages(current, [msg("c", "2026-01-01T10:02:00.000Z"), msg("b", "2026-01-01T10:01:00.000Z")]);
    expect(merged.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });
});

describe("applyReactions", () => {
  const messages = [msg("old", "2026-01-01T09:00:00.000Z", [{ emoji: "👍", userId: "u1" }]), msg("new", "2026-01-01T10:00:00.000Z")];

  it("replaces reactions inside the window and leaves older messages alone", () => {
    const next = applyReactions(messages, [{ messageId: "new", emoji: "❤️", userId: "u2" }], "2026-01-01T10:00:00.000Z");
    expect(next[0]).toBe(messages[0]);
    expect(next[1].reactions).toEqual([{ emoji: "❤️", userId: "u2" }]);
  });

  it("clears reactions removed on the server", () => {
    const withReaction = [msg("new", "2026-01-01T10:00:00.000Z", [{ emoji: "😂", userId: "u1" }])];
    expect(applyReactions(withReaction, [], "2026-01-01T10:00:00.000Z")[0].reactions).toEqual([]);
  });

  it("returns the same array when the snapshot matches, regardless of order", () => {
    const current = [msg("m", "2026-01-01T10:00:00.000Z", [{ emoji: "👍", userId: "u1" }, { emoji: "❤️", userId: "u2" }])];
    const rows = [
      { messageId: "m", emoji: "❤️", userId: "u2" },
      { messageId: "m", emoji: "👍", userId: "u1" },
    ];
    expect(applyReactions(current, rows, "2026-01-01T00:00:00.000Z")).toBe(current);
  });
});

describe("toggleLocalReaction", () => {
  it("adds, replaces and removes the user's single reaction", () => {
    const added = toggleLocalReaction([{ emoji: "👍", userId: "other" }], "me", "❤️");
    expect(added).toEqual([{ emoji: "👍", userId: "other" }, { emoji: "❤️", userId: "me" }]);
    const replaced = toggleLocalReaction(added, "me", "😂");
    expect(replaced).toEqual([{ emoji: "👍", userId: "other" }, { emoji: "😂", userId: "me" }]);
    expect(toggleLocalReaction(replaced, "me", "😂")).toEqual([{ emoji: "👍", userId: "other" }]);
  });
});

describe("groupReactions", () => {
  it("groups by emoji in order of first appearance", () => {
    const groups = groupReactions([
      { emoji: "❤️", userId: "a" },
      { emoji: "👍", userId: "b" },
      { emoji: "❤️", userId: "b" },
    ]);
    expect(groups).toEqual([
      { emoji: "❤️", userIds: ["a", "b"] },
      { emoji: "👍", userIds: ["b"] },
    ]);
  });
});
