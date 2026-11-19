import { expect, it } from "vitest";
import { loginSchema, signupSchema } from "./schemas";

it("normalizes valid signup input", () => {
  const result = signupSchema.parse({ name: " Ana ", username: "Ana_P", email: "ANA@Ex.com ", password: "12345678" });
  expect(result).toEqual({ name: "Ana", username: "ana_p", email: "ana@ex.com", password: "12345678" });
});

it("rejects invalid usernames and short passwords", () => {
  const result = signupSchema.safeParse({ name: "Ana", username: "a b", email: "ana@ex.com", password: "123" });
  expect(result.success).toBe(false);
  const fields = result.error?.issues.map((i) => i.path[0]);
  expect(fields).toEqual(expect.arrayContaining(["username", "password"]));
});

it("requires a password on login", () => {
  expect(loginSchema.safeParse({ email: "ana@ex.com", password: "" }).success).toBe(false);
});
