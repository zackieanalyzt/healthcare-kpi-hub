import {
  DEFAULT_API_PORT,
  DEFAULT_DEV_AUTH_PASSWORD,
  DEFAULT_LOG_LEVEL
} from "@healthcare-kpi-hub/config";

export type AuthProviderName = "dev" | "mariadb";
export type SameSitePolicy = "Lax" | "Strict" | "None";
export type MariaDbPasswordHashMode =
  | "bun-password"
  | "bcrypt"
  | "plaintext"
  | "md5"
  | "sha1";

export interface EnvConfig {
  apiPort: number;
  nodeEnv: string;
  sqlitePath: string;
  logLevel: string;
  authProvider: AuthProviderName;
  mariadbHost: string | null;
  mariadbPort: number | null;
  mariadbDatabase: string | null;
  mariadbUser: string | null;
  mariadbPassword: string | null;
  mariadbAuthTable: string;
  mariadbUsernameColumn: string;
  mariadbPasswordColumn: string;
  mariadbActiveColumn: string | null;
  mariadbFullNameColumn: string | null;
  mariadbFirstNameColumn: string | null;
  mariadbLastNameColumn: string | null;
  mariadbPasswordHashMode: MariaDbPasswordHashMode;
  sessionCookieName: string;
  sessionCookieSecure: boolean;
  sessionCookieSameSite: SameSitePolicy;
  sessionCookiePath: string;
  csrfCookieName: string;
  csrfHeaderName: string;
  csrfCookieSameSite: SameSitePolicy;
  sessionAbsoluteLifetimeHours: number;
  sessionIdleTimeoutHours: number;
  devAuthPassword: string;
}

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  if (typeof value === "undefined") {
    return fallback;
  }

  return Number(value);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function parseSameSite(
  value: string | undefined,
  fallback: SameSitePolicy
): SameSitePolicy {
  if (value === "Lax" || value === "Strict" || value === "None") {
    return value;
  }

  return fallback;
}

function parseMariaDbPasswordHashMode(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value.trim().toLowerCase();
}

function parseNullableString(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (
    trimmed.length === 0 ||
    trimmed.toLowerCase() === "none" ||
    trimmed.toLowerCase() === "null"
  ) {
    return null;
  }

  return trimmed.length > 0 ? trimmed : null;
}

function validateEnv(config: EnvConfig): EnvConfig {
  if (config.authProvider !== "dev" && config.authProvider !== "mariadb") {
    throw new Error("AUTH_PROVIDER must be either dev or mariadb.");
  }

  if (!Number.isFinite(config.apiPort) || config.apiPort <= 0) {
    throw new Error("API_PORT must be a positive number.");
  }

  if (!Number.isFinite(config.sessionAbsoluteLifetimeHours)) {
    throw new Error("SESSION_ABSOLUTE_LIFETIME_HOURS must be a number.");
  }

  if (!Number.isFinite(config.sessionIdleTimeoutHours)) {
    throw new Error("SESSION_IDLE_TIMEOUT_HOURS must be a number.");
  }

  if (config.sessionAbsoluteLifetimeHours <= 0) {
    throw new Error("SESSION_ABSOLUTE_LIFETIME_HOURS must be greater than zero.");
  }

  if (config.sessionIdleTimeoutHours <= 0) {
    throw new Error("SESSION_IDLE_TIMEOUT_HOURS must be greater than zero.");
  }

  if (config.sessionIdleTimeoutHours > config.sessionAbsoluteLifetimeHours) {
    throw new Error(
      "SESSION_IDLE_TIMEOUT_HOURS must not exceed SESSION_ABSOLUTE_LIFETIME_HOURS."
    );
  }

  if (config.nodeEnv === "production" && config.authProvider !== "mariadb") {
    throw new Error("Production mode requires AUTH_PROVIDER=mariadb.");
  }

  if (config.authProvider === "dev") {
    if (config.nodeEnv !== "development" && config.nodeEnv !== "test") {
      throw new Error("Dev auth provider is only allowed in development or test.");
    }

    if (!config.devAuthPassword) {
      throw new Error("DEV_AUTH_PASSWORD must be configured for dev auth.");
    }
  }

  if (config.authProvider === "mariadb") {
    if (
      !config.mariadbHost ||
      !config.mariadbPort ||
      !config.mariadbDatabase ||
      !config.mariadbUser ||
      !config.mariadbPassword
    ) {
      throw new Error(
        "AUTH_PROVIDER=mariadb requires MARIADB_HOST, MARIADB_PORT, MARIADB_DATABASE, MARIADB_USER, and MARIADB_PASSWORD."
      );
    }

    if (!Number.isFinite(config.mariadbPort) || config.mariadbPort <= 0) {
      throw new Error("MARIADB_PORT must be a positive number.");
    }

    if (
      !config.mariadbFullNameColumn &&
      (!config.mariadbFirstNameColumn || !config.mariadbLastNameColumn)
    ) {
      throw new Error(
        "MariaDB auth requires either MARIADB_FULL_NAME_COLUMN or both MARIADB_FIRST_NAME_COLUMN and MARIADB_LAST_NAME_COLUMN."
      );
    }

    if (
      config.mariadbPasswordHashMode !== "bun-password" &&
      config.mariadbPasswordHashMode !== "bcrypt" &&
      config.mariadbPasswordHashMode !== "plaintext" &&
      config.mariadbPasswordHashMode !== "md5" &&
      config.mariadbPasswordHashMode !== "sha1"
    ) {
      throw new Error(
        "MARIADB_PASSWORD_HASH_MODE must be one of bun-password, bcrypt, plaintext, md5, or sha1."
      );
    }
  }

  if (config.sessionCookieSameSite === "None" && !config.sessionCookieSecure) {
    throw new Error("SESSION_COOKIE_SAMESITE=None requires SESSION_COOKIE_SECURE=true.");
  }

  return config;
}

export function loadEnvFrom(source: Record<string, string | undefined>): EnvConfig {
  const nodeEnv = source.NODE_ENV ?? "development";
  const defaultSecureCookie = nodeEnv === "production";
  const firstNameColumn = parseNullableString(source.MARIADB_FIRST_NAME_COLUMN);
  const lastNameColumn = parseNullableString(source.MARIADB_LAST_NAME_COLUMN);

  return validateEnv({
    apiPort: parsePositiveNumber(source.API_PORT, DEFAULT_API_PORT),
    nodeEnv,
    sqlitePath: source.SQLITE_PATH ?? "./data/app.db",
    logLevel: source.LOG_LEVEL ?? DEFAULT_LOG_LEVEL,
    authProvider: (source.AUTH_PROVIDER ?? (nodeEnv === "production" ? "mariadb" : "dev")) as AuthProviderName,
    mariadbHost: parseNullableString(source.MARIADB_HOST),
    mariadbPort: source.MARIADB_PORT ? parsePositiveNumber(source.MARIADB_PORT, 3306) : null,
    mariadbDatabase: parseNullableString(source.MARIADB_DATABASE),
    mariadbUser: parseNullableString(source.MARIADB_USER),
    mariadbPassword: parseNullableString(source.MARIADB_PASSWORD),
    mariadbAuthTable: source.MARIADB_AUTH_TABLE ?? "personnel_accounts",
    mariadbUsernameColumn: source.MARIADB_USERNAME_COLUMN ?? "username",
    mariadbPasswordColumn:
      source.MARIADB_PASSWORD_COLUMN ??
      source.MARIADB_PASSWORD_HASH_COLUMN ??
      "password_hash",
    mariadbActiveColumn:
      typeof source.MARIADB_ACTIVE_COLUMN === "undefined"
        ? "is_active"
        : parseNullableString(source.MARIADB_ACTIVE_COLUMN),
    mariadbFullNameColumn:
      typeof source.MARIADB_FULL_NAME_COLUMN === "undefined"
        ? firstNameColumn || lastNameColumn
          ? null
          : "full_name"
        : parseNullableString(source.MARIADB_FULL_NAME_COLUMN),
    mariadbFirstNameColumn: firstNameColumn,
    mariadbLastNameColumn: lastNameColumn,
    mariadbPasswordHashMode: parseMariaDbPasswordHashMode(
      source.MARIADB_PASSWORD_HASH_MODE
    ) as MariaDbPasswordHashMode,
    sessionCookieName: source.SESSION_COOKIE_NAME ?? "healthcare_kpi_hub_session",
    sessionCookieSecure: parseBoolean(source.SESSION_COOKIE_SECURE, defaultSecureCookie),
    sessionCookieSameSite: parseSameSite(source.SESSION_COOKIE_SAMESITE, "Lax"),
    sessionCookiePath: source.SESSION_COOKIE_PATH ?? "/",
    csrfCookieName: source.CSRF_COOKIE_NAME ?? "healthcare_kpi_hub_csrf",
    csrfHeaderName: source.CSRF_HEADER_NAME ?? "X-CSRF-Token",
    csrfCookieSameSite: parseSameSite(source.CSRF_COOKIE_SAMESITE, "Lax"),
    sessionAbsoluteLifetimeHours: parsePositiveNumber(
      source.SESSION_ABSOLUTE_LIFETIME_HOURS,
      12
    ),
    sessionIdleTimeoutHours: parsePositiveNumber(source.SESSION_IDLE_TIMEOUT_HOURS, 2),
    devAuthPassword: source.DEV_AUTH_PASSWORD ?? DEFAULT_DEV_AUTH_PASSWORD
  });
}

export function loadEnv(): EnvConfig {
  return loadEnvFrom(Bun.env);
}
