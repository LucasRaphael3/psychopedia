import { fitDimensions, MAX_IMAGE_BYTES } from "./image";

export type PreparedImage = { blob: Blob; width: number; height: number };

/**
 * Resizes and re-encodes a picked photo to JPEG in the browser.
 * Re-encoding also strips EXIF metadata such as GPS location.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Não foi possível ler esta imagem. Tente uma foto JPG ou PNG.");
  }

  const { width, height } = fitDimensions(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
  ctx.fillStyle = "#ffffff"; // transparent PNG areas become white instead of black
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("Seu navegador não conseguiu processar a imagem.");
  if (blob.size > MAX_IMAGE_BYTES) throw new Error("A foto ficou grande demais. Tente outra imagem.");
  return { blob, width, height };
}
