import { describe, expect, test } from "bun:test";
import { createTestEnvironment, getCookie } from "../test/test-app";

describe("navigation integration", () => {
  test("returns active navigation tree for authenticated user", async () => {
    const { handler, env } = createTestEnvironment();
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

    const response = await handler(
      new Request("http://localhost/api/navigation", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBeTrue();
    expect(body.data.workgroups.length).toBe(1);
    expect(body.data.workgroups[0].code).toBe("PH");
  });

  test("inactive nodes are hidden", async () => {
    const { handler, env } = createTestEnvironment();
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

    const response = await handler(
      new Request("http://localhost/api/navigation", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain("Legacy Group");
    expect(JSON.stringify(body)).not.toContain("Inactive Page");
  });

  test("empty tree is returned safely", async () => {
    const { handler, db, env } = createTestEnvironment();
    db.query("UPDATE workgroups SET is_active = 0").run();

    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

    const response = await handler(
      new Request("http://localhost/api/navigation", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    const body = await response.json();
    expect(body.success).toBeTrue();
    expect(body.data.workgroups).toEqual([]);
  });
});
