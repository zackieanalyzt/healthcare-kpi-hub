import { describe, expect, test } from "bun:test";
import { AppError } from "../domain/shared/errors";
import type { AuthIdentityProvider, UpstreamIdentity } from "../modules/auth/provider";
import { createRequestHandler } from "./server";
import { createLogger } from "../infrastructure/logging/logger";
import { createTestEnvironment, getCookie } from "../test/test-app";

describe("auth integration", () => {
  test("login persists hashed session and me returns authenticated user", async () => {
    const { handler, db, env } = createTestEnvironment();

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

    expect(loginResponse.status).toBe(200);
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName);
    expect(sessionCookie).toBeString();

    const sessionRow = db
      .query("SELECT token_hash, revoked_at FROM sessions WHERE username = ?1")
      .get("editor.user") as { token_hash: string; revoked_at: string | null } | null;

    expect(sessionRow).not.toBeNull();
    expect(sessionRow?.token_hash).not.toBe(sessionCookie);
    expect(sessionRow?.revoked_at).toBeNull();

    const meResponse = await handler(
      new Request("http://localhost/api/me", {
        method: "GET",
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(meResponse.status).toBe(200);
    const meBody = await meResponse.json();
    expect(meBody.success).toBeTrue();
    expect(meBody.data.user.username).toBe("editor.user");
  });

  test("login provisions missing local user with default role", async () => {
    const upstreamProvider = createStaticProvider({
      username: "new.user",
      fullName: "New User",
      isActive: true
    });
    const { handler, db } = createTestEnvironment(
      {
        authProvider: "dev"
      },
      {
        identityProvider: upstreamProvider
      }
    );

    const response = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "new.user",
          password: "ignored-by-test-provider"
        })
      })
    );

    expect(response.status).toBe(200);
    const userRow = db
      .query("SELECT username, role_code, is_active FROM users WHERE username = ?1")
      .get("new.user") as
      | { username: string; role_code: string; is_active: number }
      | null;

    expect(userRow).not.toBeNull();
    expect(userRow).toEqual({
      username: "new.user",
      role_code: "viewer",
      is_active: 1
    });
  });

  test("existing local role is preserved during upstream profile sync", async () => {
    const upstreamProvider = createStaticProvider({
      username: "manager.user",
      fullName: "Updated Manager Name",
      isActive: true
    });
    const { handler, db } = createTestEnvironment(
      {
        authProvider: "dev"
      },
      {
        identityProvider: upstreamProvider
      }
    );

    const response = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "manager.user",
          password: "ignored-by-test-provider"
        })
      })
    );

    expect(response.status).toBe(200);
    const userRow = db
      .query("SELECT role_code, full_name FROM users WHERE username = ?1")
      .get("manager.user") as { role_code: string; full_name: string | null } | null;

    expect(userRow).toEqual({
      role_code: "manager",
      full_name: "Updated Manager Name"
    });
  });

  test("inactive local user is denied during login", async () => {
    const upstreamProvider = createStaticProvider({
      username: "inactive.user",
      fullName: "Inactive Local User",
      isActive: true
    });
    const { handler } = createTestEnvironment(
      {
        authProvider: "dev"
      },
      {
        identityProvider: upstreamProvider
      }
    );

    const response = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "inactive.user",
          password: "ignored-by-test-provider"
        })
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("AUTH_ACCOUNT_INACTIVE");
  });

  test("invalid session returns 401", async () => {
    const { handler, env } = createTestEnvironment();

    const response = await handler(
      new Request("http://localhost/api/me", {
        headers: {
          Cookie: `${env.sessionCookieName}=bogus`
        }
      })
    );

    expect(response.status).toBe(401);
  });

  test("empty username fails validation before auth lookup", async () => {
    const { handler, env } = createTestEnvironment();

    const response = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "   ",
          password: env.devAuthPassword
        })
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  test("revoked session returns 401", async () => {
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

    const logoutResponse = await handler(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${env.sessionCookieName}=${sessionCookie}; ${env.csrfCookieName}=${csrfCookie}`,
          [env.csrfHeaderName]: csrfCookie
        },
        body: JSON.stringify({})
      })
    );

    expect(logoutResponse.status).toBe(200);

    const meResponse = await handler(
      new Request("http://localhost/api/me", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(meResponse.status).toBe(401);
  });

  test("expired session is rejected and revoked", async () => {
    const { handler, db, env } = createTestEnvironment({
      sessionAbsoluteLifetimeHours: 0.001
    });

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
    db.query(
      "UPDATE sessions SET expires_at = datetime('now', '-1 hour') WHERE username = ?1"
    ).run("editor.user");

    const meResponse = await handler(
      new Request("http://localhost/api/me", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(meResponse.status).toBe(401);
    const sessionRow = db
      .query("SELECT revoked_at FROM sessions WHERE username = ?1")
      .get("editor.user") as { revoked_at: string | null } | null;
    expect(sessionRow?.revoked_at).toBeString();
  });

  test("idle timed out session is rejected", async () => {
    const { handler, db, env } = createTestEnvironment({
      sessionIdleTimeoutHours: 1
    });

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
    db.query(
      "UPDATE sessions SET last_seen_at = datetime('now', '-3 hour') WHERE username = ?1"
    ).run("editor.user");

    const meResponse = await handler(
      new Request("http://localhost/api/me", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(meResponse.status).toBe(401);
  });

  test("inactive user session is rejected", async () => {
    const { handler, db, env } = createTestEnvironment();

    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "viewer.user",
          password: env.devAuthPassword
        })
      })
    );

    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;
    db.query("UPDATE users SET is_active = 0 WHERE username = ?1").run("viewer.user");

    const meResponse = await handler(
      new Request("http://localhost/api/me", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(meResponse.status).toBe(401);
  });

  test("upstream unavailable rejects login without creating a session", async () => {
    const failingProvider = createFailingProvider(
      new AppError(
        "AUTH_UPSTREAM_UNAVAILABLE",
        "Authentication upstream is unavailable.",
        503
      )
    );
    const { handler, db } = createTestEnvironment(undefined, {
      identityProvider: failingProvider
    });

    const response = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "editor.user",
          password: "irrelevant"
        })
      })
    );

    expect(response.status).toBe(503);
    const sessionCount = db.query("SELECT COUNT(*) AS count FROM sessions").get() as {
      count: number;
    };
    expect(sessionCount.count).toBe(0);
  });

  test("existing session remains valid during upstream failure", async () => {
    const { handler, env, db } = createTestEnvironment();

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
    const failureHandler = createRequestHandler({
      env,
      db,
      logger: createLogger({ level: "ERROR", service: "test" }),
      identityProvider: createFailingProvider(
        new AppError(
          "AUTH_UPSTREAM_UNAVAILABLE",
          "Authentication upstream is unavailable.",
          503
        )
      )
    });

    const meResponse = await failureHandler(
      new Request("http://localhost/api/me", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(meResponse.status).toBe(200);
    const meBody = await meResponse.json();
    expect(meBody.data.user.username).toBe("editor.user");
  });
});

function createStaticProvider(identity: UpstreamIdentity): AuthIdentityProvider {
  return {
    name: "dev",
    async authenticate() {
      return identity;
    }
  };
}

function createFailingProvider(error: AppError): AuthIdentityProvider {
  return {
    name: "mariadb",
    async authenticate() {
      throw error;
    }
  };
}
