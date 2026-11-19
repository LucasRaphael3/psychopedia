import { expect, it } from "vitest";
import { detectImageType, fitDimensions } from "./image";

const bytes = (...values: number[]) => new Uint8Array([...values, ...new Array(12).fill(0)]);
const text = (s: string) => [...s].map((c) => c.charCodeAt(0));

it("detects formats from magic bytes", () => {
  expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.type).toBe("image/jpeg");
  expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47))?.ext).toBe("png");
  expect(detectImageType(bytes(...text("RIFF"), 0, 0, 0, 0, ...text("WEBP")))?.type).toBe("image/webp");
});

it("rejects files that only claim to be images", () => {
  expect(detectImageType(bytes(...text("<svg")))).toBeNull();
  expect(detectImageType(bytes(...text("GIF89a")))).toBeNull();
  expect(detectImageType(new Uint8Array())).toBeNull();
});

it("fits large images inside the maximum dimension", () => {
  expect(fitDimensions(4000, 3000)).toEqual({ width: 1600, height: 1200 });
  expect(fitDimensions(900, 3600)).toEqual({ width: 400, height: 1600 });
  expect(fitDimensions(800, 600)).toEqual({ width: 800, height: 600 });
});
