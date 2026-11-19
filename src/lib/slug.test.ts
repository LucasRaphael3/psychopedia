import { expect, it } from "vitest";
import { slugify } from "./slug";

it("removes accents and punctuation", () => {
  expect(slugify("Ansiedade: o que é e como lidar?")).toBe("ansiedade-o-que-e-e-como-lidar");
});

it("trims separators and limits length", () => {
  expect(slugify("  --Olá--  ")).toBe("ola");
  expect(slugify("a".repeat(200))).toHaveLength(80);
});
