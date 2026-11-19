import { expect, it } from "vitest";
import { safeNext } from "./safe-next";

it("accepts relative paths only", () => {
  expect(safeNext("/mensagens")).toBe("/mensagens");
  expect(safeNext("//evil.com")).toBe("/");
  expect(safeNext("/\\evil.com")).toBe("/");
  expect(safeNext("https://evil.com")).toBe("/");
  expect(safeNext(null)).toBe("/");
});
