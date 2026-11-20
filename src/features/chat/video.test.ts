import { describe, expect, it } from "vitest";
import { EMOJI_CATEGORIES, isAllowedEmoji, QUICK_REACTIONS } from "./emoji-data";
import { reactionSchema, videoMessageSchema, videoUploadSchema } from "./schemas";
import { isVideoType, matchesVideoSignature, MAX_VIDEO_BYTES, VIDEO_PATH_PATTERN } from "./video";

const bytes = (...values: number[]) => new Uint8Array([...values, ...new Array(16).fill(0)]);
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));
const ids = { conv: "11111111-1111-4111-8111-111111111111", user: "22222222-2222-4222-8222-222222222222", file: "33333333-3333-4333-8333-333333333333" };

describe("video rules", () => {
  it("accepts only MP4, MOV and WebM", () => {
    expect(isVideoType("video/mp4")).toBe(true);
    expect(isVideoType("video/quicktime")).toBe(true);
    expect(isVideoType("video/webm")).toBe(true);
    expect(isVideoType("video/x-matroska")).toBe(false);
    expect(isVideoType("toString")).toBe(false);
  });

  it("checks the container signature against the declared type", () => {
    const mp4 = bytes(0, 0, 0, 0x20, ...ascii("ftypisom"));
    const webm = bytes(0x1a, 0x45, 0xdf, 0xa3);
    expect(matchesVideoSignature("video/mp4", mp4)).toBe(true);
    expect(matchesVideoSignature("video/quicktime", mp4)).toBe(true);
    expect(matchesVideoSignature("video/webm", webm)).toBe(true);
    expect(matchesVideoSignature("video/mp4", webm)).toBe(false);
    expect(matchesVideoSignature("video/webm", mp4)).toBe(false);
    expect(matchesVideoSignature("video/mp4", bytes(...ascii("<html><script>")))).toBe(false);
  });

  it("only accepts storage keys shaped as conversation/sender/uuid.ext", () => {
    expect(VIDEO_PATH_PATTERN.test(`${ids.conv}/${ids.user}/${ids.file}.mp4`)).toBe(true);
    expect(VIDEO_PATH_PATTERN.test(`${ids.conv}/${ids.user}/../${ids.file}.mp4`)).toBe(false);
    expect(VIDEO_PATH_PATTERN.test(`${ids.conv}/${ids.file}.mp4`)).toBe(false);
    expect(VIDEO_PATH_PATTERN.test(`${ids.conv}/${ids.user}/${ids.file}.html`)).toBe(false);
  });

  it("validates upload requests and messages", () => {
    expect(videoUploadSchema.safeParse({ conversationId: ids.conv, contentType: "video/mp4", size: MAX_VIDEO_BYTES }).success).toBe(true);
    expect(videoUploadSchema.safeParse({ conversationId: ids.conv, contentType: "video/mp4", size: MAX_VIDEO_BYTES + 1 }).success).toBe(false);
    expect(videoUploadSchema.safeParse({ conversationId: ids.conv, contentType: "image/png", size: 10 }).success).toBe(false);
    const message = { conversationId: ids.conv, path: `${ids.conv}/${ids.user}/${ids.file}.webm`, caption: " oi ", width: 1280, height: 720 };
    expect(videoMessageSchema.parse(message).caption).toBe("oi");
    expect(videoMessageSchema.safeParse({ ...message, width: 0 }).success).toBe(false);
  });
});

describe("emoji set", () => {
  it("has no duplicates and includes every quick reaction", () => {
    const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    expect(new Set(all).size).toBe(all.length);
    for (const emoji of QUICK_REACTIONS) expect(isAllowedEmoji(emoji)).toBe(true);
  });

  it("rejects text that isn't in the set", () => {
    expect(reactionSchema.safeParse({ messageId: ids.conv, emoji: "❤️" }).success).toBe(true);
    expect(reactionSchema.safeParse({ messageId: ids.conv, emoji: "<b>oi</b>" }).success).toBe(false);
    expect(reactionSchema.safeParse({ messageId: ids.conv, emoji: "❤️❤️" }).success).toBe(false);
  });
});
