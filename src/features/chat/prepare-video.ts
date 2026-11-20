import { isVideoType, MAX_VIDEO_BYTES, MAX_VIDEO_DIMENSION, type VideoType } from "./video";

export type PreparedVideo = { file: File; type: VideoType; width: number; height: number; previewUrl: string };

const METADATA_TIMEOUT_MS = 15_000;

function readVideoSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const video = document.createElement("video");
    const done = () => {
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
    };
    const fail = () => {
      done();
      reject(new Error("Não foi possível abrir este vídeo neste navegador. Prefira MP4 (H.264)."));
    };
    const timer = setTimeout(fail, METADATA_TIMEOUT_MS);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const size = { width: video.videoWidth, height: video.videoHeight };
      done();
      if (size.width > 0 && size.height > 0) resolve(size);
      else reject(new Error("Este arquivo não tem imagem de vídeo."));
    };
    video.onerror = fail;
    video.src = src;
  });
}

/**
 * Validates a picked video and reads its dimensions (used to reserve space in the chat).
 * Videos are sent as they are: the browser can't re-encode them, so metadata is kept.
 */
export async function prepareVideo(file: File): Promise<PreparedVideo> {
  if (!isVideoType(file.type)) throw new Error("Formato de vídeo não suportado. Use MP4, MOV ou WebM.");
  if (file.size > MAX_VIDEO_BYTES) throw new Error("O vídeo precisa ter no máximo 50 MB.");

  const previewUrl = URL.createObjectURL(file);
  try {
    const { width, height } = await readVideoSize(previewUrl);
    const clamp = (n: number) => Math.min(Math.max(Math.round(n), 1), MAX_VIDEO_DIMENSION);
    return { file, type: file.type, width: clamp(width), height: clamp(height), previewUrl };
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
}

/**
 * PUTs the file to the signed storage URL with upload progress (fetch can't report it).
 * Resolves when stored; rejects on failure or when `signal` aborts.
 */
export function uploadVideo(url: string, file: File, onProgress: (fraction: number) => void, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Falha no envio do vídeo.")));
    xhr.onerror = () => reject(new Error("Falha de conexão ao enviar o vídeo."));
    xhr.onabort = () => reject(new DOMException("Envio cancelado.", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}
