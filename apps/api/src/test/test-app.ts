import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequestHandler } from "../app/server";
import { createLogger } from "../infrastructure/logging/logger";
import { createSqliteConnection } from "../infrastructure/sqlite/client";
import {
  ensureMigrationTable,
  ensureSqliteDirectory,
  runSqlDirectory
} from "../infrastructure/sqlite/runner";
import {
  resolveMigrationDirectory,
  resolveSeedDirectory
} from "../infrastructure/sqlite/paths";
import type { EnvConfig } from "../infrastructure/config/env";
import { createAuthIdentityProvider, type AuthIdentityProvider } from "../modules/auth/provider";

export function createTestEnvironment(
  overrides?: Partial<EnvConfig>,
  options?: { identityProvider?: AuthIdentityProvider }
) {
  const directory = mkdtempSync(join(tmpdir(), "healthcare-kpi-hub-"));
  const sqlitePath = join(directory, "test.db");

  const env: EnvConfig = {
    apiPort: 3000,
    nodeEnv: "test",
    sqlitePath,
    logLevel: "ERROR",
    authProvider: "dev",
    mariadbHost: null,
    mariadbPort: null,
    mariadbDatabase: null,
    mariadbUser: null,
    mariadbPassword: null,
    mariadbAuthTable: "personnel_accounts",
    mariadbUsernameColumn: "username",
    mariadbPasswordColumn: "password_hash",
    mariadbActiveColumn: "is_active",
    mariadbFullNameColumn: "full_name",
    mariadbFirstNameColumn: null,
    mariadbLastNameColumn: null,
    mariadbPasswordHashMode: "bcrypt",
    sessionCookieName: "healthcare_kpi_hub_session",
    sessionCookieSecure: false,
    sessionCookieSameSite: "Lax",
    sessionCookiePath: "/",
    csrfCookieName: "healthcare_kpi_hub_csrf",
    csrfHeaderName: "X-CSRF-Token",
    csrfCookieSameSite: "Lax",
    sessionAbsoluteLifetimeHours: 12,
    sessionIdleTimeoutHours: 2,
    devAuthPassword: "dev-password",
    ...overrides
  };

  ensureSqliteDirectory(sqlitePath);
  const db = createSqliteConnection({ path: sqlitePath });
  ensureMigrationTable(db);
  runSqlDirectory(db, resolveMigrationDirectory(), { trackMigrations: true });
  runSqlDirectory(db, resolveSeedDirectory(), { trackMigrations: false });

  const logger = createLogger({ level: "ERROR", service: "test" });
  const identityProvider = options?.identityProvider ?? createAuthIdentityProvider(env);
  const handler = createRequestHandler({ env, logger, db, identityProvider });

  return { env, db, handler, identityProvider };
}

export function getCookie(response: Response, cookieName: string): string | null {
  const setCookie = response.headers.get("Set-Cookie");
  if (!setCookie) {
    return null;
  }

  const match = setCookie.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}
