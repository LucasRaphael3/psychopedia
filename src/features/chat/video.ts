/** Rules shared by the chat video upload on client and server. */

/** Supabase's per-file limit on the free plan; the bucket enforces the same value. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_DIMENSION = 8192;

export const VIDEO_TYPES = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" } as const;
export type VideoType = keyof typeof VIDEO_TYPES;

export function isVideoType(value: string): value is VideoType {
  return Object.hasOwn(VIDEO_TYPES, value);
}

/**
 * Checks the container signature of the first bytes against the declared type:
 * MP4 and MOV are ISO-BMFF files with "ftyp" at offset 4; WebM starts with the EBML magic 1A 45 DF A3.
 */
export function matchesVideoSignature(type: VideoType, bytes: Uint8Array) {
  if (type === "video/webm") return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  return bytes.length >= 8 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
}

/** Storage key for a video: `<conversationId>/<senderId>/<uuid>.<ext>`, so a key can't be claimed by someone else. */
export const VIDEO_PATH_PATTERN = /^([0-9a-f-]{36})\/([0-9a-f-]{36})\/[0-9a-f-]{36}\.(mp4|mov|webm)$/;
