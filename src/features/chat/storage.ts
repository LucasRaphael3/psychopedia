import "server-only";
import { getStorageConfig } from "@/lib/env";

export const CHAT_IMAGES_BUCKET = "chat-images";

function headers(extra?: Record<string, string>) {
  const { key } = getStorageConfig();
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys only use apikey.
  const auth: Record<string, string> = key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {};
  return { apikey: key, ...auth, ...extra };
}

function objectUrl(path: string) {
  const { url } = getStorageConfig();
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/${CHAT_IMAGES_BUCKET}/${encoded}`;
}

export async function uploadChatImage(path: string, body: Uint8Array, contentType: string) {
  const res = await fetch(objectUrl(path), {
    method: "POST",
    headers: headers({ "Content-Type": contentType, "x-upsert": "false", "Cache-Control": "max-age=31536000" }),
    body: body as BodyInit,
  });
  if (!res.ok) throw new Error(`Storage upload failed with status ${res.status}`);
}

export async function downloadChatImage(path: string) {
  const res = await fetch(objectUrl(path), { headers: headers(), cache: "no-store" });
  if (!res.ok || !res.body) return null;
  return { body: res.body, contentType: res.headers.get("content-type") ?? "application/octet-stream" };
}

export async function deleteChatImage(path: string) {
  const { url } = getStorageConfig();
  await fetch(`${url}/storage/v1/object/${CHAT_IMAGES_BUCKET}`, {
    method: "DELETE",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ prefixes: [path] }),
  });
}
