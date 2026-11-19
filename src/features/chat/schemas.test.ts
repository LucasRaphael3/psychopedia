import { expect, it } from "vitest";
import { messageSchema, orderPair } from "./schemas";

it("orders participant ids deterministically", () => {
  expect(orderPair("b", "a")).toEqual(["a", "b"]);
  expect(orderPair("a", "b")).toEqual(["a", "b"]);
});

it("rejects blank and oversized messages", () => {
  const conversationId = "6f1d2c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f";
  expect(messageSchema.safeParse({ conversationId, body: "   " }).success).toBe(false);
  expect(messageSchema.safeParse({ conversationId, body: "x".repeat(2001) }).success).toBe(false);
  expect(messageSchema.parse({ conversationId, body: " oi " }).body).toBe("oi");
});
