import { describe, expect, test } from "bun:test";
import { createTestEnvironment, getCookie } from "../test/test-app";

describe("csrf protection", () => {
  test("mutation routes reject missing csrf token", async () => {
    const { handler, env } = createTestEnvironment();
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "editor.user",
          password: env.devAuthPassword
        })
      })
    );

    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;
    const response = await handler(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("AUTH_CSRF_REQUIRED");
  });

  test("mutation routes reject invalid csrf token", async () => {
    const { handler, env } = createTestEnvironment();
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "editor.user",
          password: env.devAuthPassword
        })
      })
    );

    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;
    const csrfCookie = getCookie(loginResponse, env.csrfCookieName)!;
    const response = await handler(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}; ${env.csrfCookieName}=${csrfCookie}`,
          [env.csrfHeaderName]: "not-the-cookie-token"
        }
      })
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("AUTH_CSRF_INVALID");
  });

  test("valid csrf token allows logout", async () => {
    const { handler, env } = createTestEnvironment();
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "editor.user",
          password: env.devAuthPassword
        })
      })
    );

    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;
    const csrfCookie = getCookie(loginResponse, env.csrfCookieName)!;
    const response = await handler(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}; ${env.csrfCookieName}=${csrfCookie}`,
          [env.csrfHeaderName]: csrfCookie
        }
      })
    );

    expect(response.status).toBe(200);
  });
});
