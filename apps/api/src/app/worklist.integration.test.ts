import { describe, expect, test } from "bun:test";
import { createTestEnvironment, getCookie } from "../test/test-app";

describe("worklist integration", () => {
  test("returns current period worklist with pagination metadata", async () => {
    const { handler, env } = createTestEnvironment();
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "editor.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

    const response = await handler(
      new Request("http://localhost/api/worklist?page=1&page_size=1", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBeTrue();
    expect(body.meta.pagination.page_size).toBe(1);
    expect(body.meta.pagination.total_items).toBe(1);
  });

  test("editable flag reflects update permission and lock state", async () => {
    const { handler, env } = createTestEnvironment();
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "editor.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

    const response = await handler(
      new Request("http://localhost/api/worklist?mine=false", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    const body = await response.json();
    expect(body.data.items.some((item: { editable: boolean }) => item.editable)).toBeTrue();
    expect(body.data.items.some((item: { status: string; editable: boolean }) => item.status === "locked" && item.editable === false)).toBeTrue();
  });

  test("current period logic fails cleanly when no open period exists", async () => {
    const { handler, db, env } = createTestEnvironment();
    db.query("UPDATE reporting_periods SET status = 'closed'").run();

    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "editor.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

    const response = await handler(
      new Request("http://localhost/api/worklist", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(404);
  });
});
