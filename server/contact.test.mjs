import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateContactInput } from "./contact.mjs";

describe("validateContactInput", () => {
  it("returns empty array for valid input", () => {
    const errors = validateContactInput({
      name: "Alice Smith",
      email: "alice@example.com",
      message: "Hello there"
    });
    assert.deepEqual(errors, []);
  });

  it("requires name", () => {
    const errors = validateContactInput({ name: "", email: "a@b.com", message: "Hi" });
    assert.ok(errors.some((e) => e.toLowerCase().includes("name")));
  });

  it("requires name to be non-whitespace", () => {
    const errors = validateContactInput({ name: "   ", email: "a@b.com", message: "Hi" });
    assert.ok(errors.some((e) => e.toLowerCase().includes("name")));
  });

  it("requires email", () => {
    const errors = validateContactInput({ name: "Alice", email: "", message: "Hi" });
    assert.ok(errors.some((e) => e.toLowerCase().includes("email")));
  });

  it("rejects invalid email format", () => {
    const errors = validateContactInput({ name: "Alice", email: "notanemail", message: "Hi" });
    assert.ok(errors.some((e) => e.toLowerCase().includes("valid")));
  });

  it("accepts email with subdomain", () => {
    const errors = validateContactInput({
      name: "Alice",
      email: "alice@mail.example.com",
      message: "Hi"
    });
    assert.deepEqual(errors, []);
  });

  it("requires message", () => {
    const errors = validateContactInput({ name: "Alice", email: "a@b.com", message: "" });
    assert.ok(errors.some((e) => e.toLowerCase().includes("message")));
  });

  it("rejects message over 2000 chars", () => {
    const errors = validateContactInput({
      name: "Alice",
      email: "a@b.com",
      message: "x".repeat(2001)
    });
    assert.ok(errors.some((e) => e.includes("2000")));
  });

  it("accepts message of exactly 2000 chars", () => {
    const errors = validateContactInput({
      name: "Alice",
      email: "a@b.com",
      message: "x".repeat(2000)
    });
    assert.deepEqual(errors, []);
  });
});
