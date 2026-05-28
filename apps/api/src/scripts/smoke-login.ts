import { isAppError } from "../domain/shared/errors";
import { createRequestHandler } from "../app/server";
import { loadEnv } from "../infrastructure/config/env";
import { createLogger } from "../infrastructure/logging/logger";
import { createSqliteConnection } from "../infrastructure/sqlite/client";
import { ensureSqliteDirectory } from "../infrastructure/sqlite/runner";
import { createAuthIdentityProvider } from "../modules/auth/provider";

let identityProvider: ReturnType<typeof createAuthIdentityProvider> | null = null;

try {
  const env = loadEnv();
  const smokeUsername = Bun.env.SMOKE_LOGIN_USERNAME?.trim() ?? "";
  const smokePassword = Bun.env.SMOKE_LOGIN_PASSWORD ?? "";

  if (env.authProvider !== "mariadb") {
    throw new Error("AUTH_PROVIDER must be mariadb for auth:smoke-login.");
  }

  if (!smokeUsername || !smokePassword) {
    throw new Error(
      "SMOKE_LOGIN_USERNAME and SMOKE_LOGIN_PASSWORD must be provided for auth:smoke-login."
    );
  }

  ensureSqliteDirectory(env.sqlitePath);
  const db = createSqliteConnection({ path: env.sqlitePath });
  const logger = createLogger({ level: "ERROR", service: "auth-smoke" });
  identityProvider = createAuthIdentityProvider(env);
  const handler = createRequestHandler({
    env,
    logger,
    db,
    identityProvider
  });

  const beforeUser = db
    .query(
      `SELECT id, username, role_code, is_active, full_name
       FROM users
       WHERE username = ?1`
    )
    .get(smokeUsername) as
    | {
        id: string;
        username: string;
        role_code: string;
        is_active: number;
        full_name: string | null;
      }
    | null;

  const loginResponse = await handler(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: smokeUsername,
        password: smokePassword
      })
    })
  );
  const loginBody = await loginResponse.json();
  if (loginResponse.status !== 200) {
    console.log(
      JSON.stringify(
        {
          success: false,
          username: maskUsername(smokeUsername),
          login_status: loginResponse.status,
          error_code: loginBody.error?.code ?? "UNKNOWN_ERROR",
          message: loginBody.error?.message ?? "Login failed."
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const sessionCookie = getCookieValue(loginResponse, env.sessionCookieName);
  const csrfCookie = getCookieValue(loginResponse, env.csrfCookieName);
  if (!sessionCookie || !csrfCookie) {
    throw new Error("Login response did not include required auth cookies.");
  }

  const latestSession = db
    .query(
      `SELECT id, token_hash, revoked_at
       FROM sessions
       WHERE username = ?1
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(smokeUsername) as
    | {
        id: string;
        token_hash: string;
        revoked_at: string | null;
      }
    | null;

  const meResponse = await handler(
    new Request("http://localhost/api/me", {
      method: "GET",
      headers: {
        Cookie: `${env.sessionCookieName}=${sessionCookie}`
      }
    })
  );
  const meBody = await meResponse.json();

  const afterUser = db
    .query(
      `SELECT id, username, role_code, is_active, full_name
       FROM users
       WHERE username = ?1`
    )
    .get(smokeUsername) as
    | {
        id: string;
        username: string;
        role_code: string;
        is_active: number;
        full_name: string | null;
      }
    | null;

  const logoutResponse = await handler(
    new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: {
        Cookie: `${env.sessionCookieName}=${sessionCookie}; ${env.csrfCookieName}=${csrfCookie}`,
        [env.csrfHeaderName]: csrfCookie
      }
    })
  );
  const logoutBody = await logoutResponse.json();

  const revokedSession = latestSession
    ? (db
        .query(`SELECT revoked_at FROM sessions WHERE id = ?1`)
        .get(latestSession.id) as { revoked_at: string | null } | null)
    : null;

  const postLogoutMeResponse = await handler(
    new Request("http://localhost/api/me", {
      method: "GET",
      headers: {
        Cookie: `${env.sessionCookieName}=${sessionCookie}`
      }
    })
  );

  console.log(
    JSON.stringify(
      {
        success: true,
        username: maskUsername(smokeUsername),
        login_status: loginResponse.status,
        session_cookie_set: true,
        csrf_cookie_set: true,
        session_persisted_hashed:
          Boolean(latestSession?.token_hash) &&
          Boolean(latestSession && latestSession.token_hash !== sessionCookie),
        provisioning: {
          local_user_existed_before: Boolean(beforeUser),
          local_user_exists_after: Boolean(afterUser),
          action: beforeUser ? "updated_existing" : "created_new",
          default_role_assigned: !beforeUser ? afterUser?.role_code === "viewer" : null,
          role_preserved: beforeUser ? beforeUser.role_code === afterUser?.role_code : null,
          local_is_active: afterUser?.is_active === 1,
          full_name_present: Boolean(afterUser?.full_name)
        },
        me: {
          status: meResponse.status,
          role_code: meBody.data?.user?.role_code ?? null,
          permissions: meBody.data?.user?.permissions ?? [],
          permission_count: Array.isArray(meBody.data?.user?.permissions)
            ? meBody.data.user.permissions.length
            : 0
        },
        logout: {
          status: logoutResponse.status,
          logged_out: logoutBody.data?.logged_out ?? false,
          session_revoked: Boolean(revokedSession?.revoked_at)
        },
        post_logout_me_status: postLogoutMeResponse.status
      },
      null,
      2
    )
  );

  if (
    meResponse.status !== 200 ||
    logoutResponse.status !== 200 ||
    postLogoutMeResponse.status !== 401 ||
    !revokedSession?.revoked_at
  ) {
    process.exit(1);
  }
} catch (error) {
  console.log(
    JSON.stringify(
      {
        success: false,
        error_code: isAppError(error) ? error.code : "AUTH_CONFIGURATION_INVALID",
        message:
          error instanceof Error
            ? error.message
            : "Authentication smoke login failed."
      },
      null,
      2
    )
  );
  process.exit(1);
} finally {
  if (identityProvider?.close) {
    await identityProvider.close();
  }
}

function getCookieValue(response: Response, cookieName: string): string | null {
  const setCookie = response.headers.get("Set-Cookie");
  if (!setCookie) {
    return null;
  }

  const match = setCookie.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function maskUsername(username: string): string {
  if (/^\d+$/.test(username)) {
    if (username.length <= 2) {
      return `${username[0] ?? "*"}*`;
    }

    return `${username.slice(0, 2)}${"*".repeat(Math.max(3, username.length - 3))}${username.slice(-1)}`;
  }

  const [localPart, domainPart] = username.split(".", 2);
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  const trailing = localPart.length > 2 ? localPart.slice(-1) : "";
  const maskedLocal = `${visible}${"*".repeat(Math.max(3, localPart.length - visible.length - trailing.length))}${trailing}`;

  return domainPart ? `${maskedLocal}.${domainPart}` : maskedLocal;
}
