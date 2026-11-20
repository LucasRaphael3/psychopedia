import "server-only";
import { getStorageConfig } from "@/lib/env";

export const CHAT_IMAGES_BUCKET = "chat-images";
export const CHAT_VIDEOS_BUCKET = "chat-videos";
type Bucket = typeof CHAT_IMAGES_BUCKET | typeof CHAT_VIDEOS_BUCKET;

function headers(extra?: Record<string, string>) {
  const { key } = getStorageConfig();
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys only use apikey.
  const auth: Record<string, string> = key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {};
  return { apikey: key, ...auth, ...extra };
}

function storageUrl(route: string, bucket: Bucket, path?: string) {
  const { url } = getStorageConfig();
  const encoded = path ? `/${path.split("/").map(encodeURIComponent).join("/")}` : "";
  return `${url}/storage/v1/${route}/${bucket}${encoded}`;
}

async function deleteObject(bucket: Bucket, path: string) {
  await fetch(storageUrl("object", bucket), {
    method: "DELETE",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ prefixes: [path] }),
  });
}

export async function uploadChatImage(path: string, body: Uint8Array, contentType: string) {
  const res = await fetch(storageUrl("object", CHAT_IMAGES_BUCKET, path), {
    method: "POST",
    headers: headers({ "Content-Type": contentType, "x-upsert": "false", "Cache-Control": "max-age=31536000" }),
    body: body as BodyInit,
  });
  if (!res.ok) throw new Error(`Storage upload failed with status ${res.status}`);
}

export async function downloadChatImage(path: string) {
  const res = await fetch(storageUrl("object", CHAT_IMAGES_BUCKET, path), { headers: headers(), cache: "no-store" });
  if (!res.ok || !res.body) return null;
  return { body: res.body, contentType: res.headers.get("content-type") ?? "application/octet-stream" };
}

export function deleteChatImage(path: string) {
  return deleteObject(CHAT_IMAGES_BUCKET, path);
}

/**
 * One-time URL the browser uses to PUT a video straight into the private bucket, so large files
 * never pass through the app's functions. The token only allows creating this exact key (no overwrite).
 */
export async function createVideoUploadUrl(path: string) {
  const res = await fetch(storageUrl("object/upload/sign", CHAT_VIDEOS_BUCKET, path), { method: "POST", headers: headers() });
  if (!res.ok) throw new Error(`Storage signed upload failed with status ${res.status}`);
  const data = (await res.json()) as { url?: string };
  if (!data.url?.startsWith("/object/upload/sign/")) throw new Error("Storage signed upload returned no URL");
  return `${getStorageConfig().url}/storage/v1${data.url}`;
}

/** First bytes, total size and stored content type of an uploaded video, or null if it doesn't exist. */
export async function readVideoHead(path: string) {
  const res = await fetch(storageUrl("object/authenticated", CHAT_VIDEOS_BUCKET, path), {
    headers: headers({ Range: "bytes=0-15" }),
    cache: "no-store",
  });
  if (!res.ok || !res.body) return null;
  const size = Number(/\/(\d+)$/.exec(res.headers.get("content-range") ?? "")?.[1] ?? res.headers.get("content-length"));

  // Read just enough of the stream even if the server ignored the Range header.
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (length < 16) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    length += value.length;
  }
  // Not awaited: Next's patched fetch tees the body, and cancelling one branch of a tee only
  // settles once the other branch is cancelled too, so awaiting here would hang the request.
  void reader.cancel().catch(() => undefined);
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return { bytes: bytes.slice(0, 16), size, contentType: res.headers.get("content-type") ?? "" };
}

/** Short-lived signed URL used to stream a video (supports Range requests for seeking). */
export async function createVideoSignedUrl(path: string, expiresInSeconds: number) {
  const res = await fetch(storageUrl("object/sign", CHAT_VIDEOS_BUCKET, path), {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { signedURL?: string };
  return data.signedURL ? `${getStorageConfig().url}/storage/v1${data.signedURL}` : null;
}

export function deleteChatVideo(path: string) {
  return deleteObject(CHAT_VIDEOS_BUCKET, path);
}
