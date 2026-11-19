import { expect, it } from "vitest";
import { initials, readingMinutes, relativeTime } from "./format";

it("formats relative time in Portuguese", () => {
  const now = new Date("2026-01-10T12:00:00Z");
  expect(relativeTime(new Date("2026-01-10T11:59:50Z"), now)).toBe("agora");
  expect(relativeTime(new Date("2026-01-10T11:30:00Z"), now)).toBe("30 min");
  expect(relativeTime(new Date("2026-01-10T08:00:00Z"), now)).toBe("4 h");
  expect(relativeTime(new Date("2026-01-09T12:00:00Z"), now)).toBe("1 dia");
});

it("computes initials and reading time", () => {
  expect(initials("Ana Maria Souza")).toBe("AM");
  expect(readingMinutes("palavra ".repeat(450))).toBe(2);
  expect(readingMinutes("")).toBe(1);
});
