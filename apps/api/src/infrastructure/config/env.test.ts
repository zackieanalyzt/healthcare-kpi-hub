import { describe, expect, test } from "bun:test";
import { loadEnvFrom } from "./env";

describe("environment validation", () => {
  test("production rejects dev auth provider", () => {
    expect(() =>
      loadEnvFrom({
        NODE_ENV: "production",
        AUTH_PROVIDER: "dev"
      })
    ).toThrow("Production mode requires AUTH_PROVIDER=mariadb.");
  });

  test("mariadb auth requires complete upstream config", () => {
    expect(() =>
      loadEnvFrom({
        NODE_ENV: "production",
        AUTH_PROVIDER: "mariadb",
        MARIADB_HOST: "localhost",
        MARIADB_PORT: "3306",
        MARIADB_PASSWORD_HASH_MODE: "bcrypt"
      })
    ).toThrow("AUTH_PROVIDER=mariadb requires MARIADB_HOST");
  });

  test("mariadb auth requires explicit password hash mode", () => {
    expect(() =>
      loadEnvFrom({
        NODE_ENV: "production",
        AUTH_PROVIDER: "mariadb",
        MARIADB_HOST: "localhost",
        MARIADB_PORT: "3306",
        MARIADB_DATABASE: "personnel",
        MARIADB_USER: "app",
        MARIADB_PASSWORD: "secret"
      })
    ).toThrow("MARIADB_PASSWORD_HASH_MODE must be one of");
  });

  test("same site none requires secure cookie", () => {
    expect(() =>
      loadEnvFrom({
        NODE_ENV: "development",
        AUTH_PROVIDER: "dev",
        SESSION_COOKIE_SAMESITE: "None",
        SESSION_COOKIE_SECURE: "false"
      })
    ).toThrow("SESSION_COOKIE_SAMESITE=None requires SESSION_COOKIE_SECURE=true.");
  });

  test("valid mariadb config loads successfully", () => {
    const env = loadEnvFrom({
      NODE_ENV: "production",
      AUTH_PROVIDER: "mariadb",
      MARIADB_HOST: "localhost",
      MARIADB_PORT: "3306",
      MARIADB_DATABASE: "personnel",
      MARIADB_USER: "app",
      MARIADB_PASSWORD: "secret",
      MARIADB_PASSWORD_HASH_MODE: "bcrypt",
      SESSION_COOKIE_SECURE: "true"
    });

    expect(env.authProvider).toBe("mariadb");
    expect(env.sessionCookieSecure).toBeTrue();
  });

  test("blank active column is allowed for legacy upstreams", () => {
    const env = loadEnvFrom({
      NODE_ENV: "development",
      AUTH_PROVIDER: "mariadb",
      MARIADB_HOST: "localhost",
      MARIADB_PORT: "3306",
      MARIADB_DATABASE: "hr",
      MARIADB_USER: "app",
      MARIADB_PASSWORD: "secret",
      MARIADB_USERNAME_COLUMN: "fingle_id",
      MARIADB_PASSWORD_COLUMN: "hr_password",
      MARIADB_FIRST_NAME_COLUMN: "hr_fname",
      MARIADB_LAST_NAME_COLUMN: "hr_laname",
      MARIADB_ACTIVE_COLUMN: "",
      MARIADB_PASSWORD_HASH_MODE: "md5"
    });

    expect(env.mariadbActiveColumn).toBeNull();
    expect(env.mariadbPasswordHashMode).toBe("md5");
  });
});
