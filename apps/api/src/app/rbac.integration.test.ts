import { describe, expect, test } from "bun:test";
import { createTestEnvironment, getCookie } from "../test/test-app";

async function loginAs(handler: (request: Request) => Promise<Response>, username: string, password: string, sessionCookieName: string) {
  const response = await handler(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    })
  );

  return getCookie(response, sessionCookieName)!;
}

describe("rbac integration", () => {
  test("deny by default for missing session", async () => {
    const { handler } = createTestEnvironment();
    const response = await handler(new Request("http://localhost/api/navigation"));
    expect(response.status).toBe(401);
  });

  test("permission mismatch returns 403", async () => {
    const { handler, env } = createTestEnvironment();
    const sessionCookie = await loginAs(
      handler,
      "editor.user",
      env.devAuthPassword,
      env.sessionCookieName
    );

    const response = await handler(
      new Request("http://localhost/api/admin/navigation/workgroups", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(403);
  });
});
