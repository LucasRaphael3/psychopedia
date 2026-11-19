import { expect, it } from "vitest";
import { articleSchema } from "./schemas";

const valid = {
  title: "Como a respiração afeta a ansiedade",
  summary: "Um resumo com tamanho suficiente para passar.",
  category: "ansiedade",
  content: "texto ".repeat(60),
  sourceUrl: "",
};

it("accepts a valid article and normalizes an empty source", () => {
  expect(articleSchema.parse(valid).sourceUrl).toBeNull();
});

it("rejects unknown categories and non-http sources", () => {
  expect(articleSchema.safeParse({ ...valid, category: "astrologia" }).success).toBe(false);
  expect(articleSchema.safeParse({ ...valid, sourceUrl: "javascript:alert(1)" }).success).toBe(false);
});
