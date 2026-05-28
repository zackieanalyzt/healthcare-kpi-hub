import { describe, expect, test } from "bun:test";
import { generateSessionToken, hashSessionToken } from "./token";

describe("session token helpers", () => {
  test("generates non-empty session token", () => {
    expect(generateSessionToken().length).toBeGreaterThan(0);
  });

  test("hashes the same token deterministically", async () => {
    const token = "sample-token";
    const left = await hashSessionToken(token);
    const right = await hashSessionToken(token);

    expect(left).toBe(right);
    expect(left).not.toBe(token);
  });
});
