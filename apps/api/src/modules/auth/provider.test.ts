import { createHash } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { AppError } from "../../domain/shared/errors";
import type { EnvConfig } from "../../infrastructure/config/env";
import {
  DevIdentityProvider,
  MariaDbIdentityProvider,
  type MariaDbQueryClient
} from "./provider";

const baseEnv: EnvConfig = {
  apiPort: 3000,
  nodeEnv: "test",
  sqlitePath: ":memory:",
  logLevel: "ERROR",
  authProvider: "dev",
  mariadbHost: "localhost",
  mariadbPort: 3306,
  mariadbDatabase: "personnel",
  mariadbUser: "app",
  mariadbPassword: "secret",
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
  devAuthPassword: "dev-password"
};

describe("auth providers", () => {
  test("dev provider authenticates with configured password", async () => {
    const provider = new DevIdentityProvider(baseEnv);

    const identity = await provider.authenticate({
      username: "editor.user",
      password: "dev-password"
    });

    expect(identity.username).toBe("editor.user");
    expect(identity.isActive).toBeTrue();
  });

  test("dev provider rejects invalid password", async () => {
    const provider = new DevIdentityProvider(baseEnv);

    expect(
      provider.authenticate({ username: "editor.user", password: "wrong" })
    ).rejects.toMatchObject({
      code: "AUTH_INVALID_CREDENTIALS",
      status: 401
    } satisfies Partial<AppError>);
  });

  test("mariadb provider authenticates against bcrypt upstream row", async () => {
    const passwordHash = await Bun.password.hash("correct-password");
    const provider = new MariaDbIdentityProvider(
      { ...baseEnv, authProvider: "mariadb", mariadbPasswordHashMode: "bcrypt" },
      createFakeClient([
        {
          upstream_username: "editor.user",
          upstream_password_value: passwordHash,
          upstream_is_active: 1,
          upstream_full_name: "Editor User"
        }
      ])
    );

    const identity = await provider.authenticate({
      username: "editor.user",
      password: "correct-password"
    });

    expect(identity).toEqual({
      username: "editor.user",
      fullName: "Editor User",
      isActive: true
    });
  });

  test("mariadb provider authenticates against plaintext upstream row", async () => {
    const provider = new MariaDbIdentityProvider(
      { ...baseEnv, authProvider: "mariadb", mariadbPasswordHashMode: "plaintext" },
      createFakeClient([
        {
          upstream_username: "editor.user",
          upstream_password_value: "plain-secret",
          upstream_is_active: 1,
          upstream_full_name: "Editor User"
        }
      ])
    );

    const identity = await provider.authenticate({
      username: "editor.user",
      password: "plain-secret"
    });

    expect(identity.isActive).toBeTrue();
  });

  test("mariadb provider authenticates against md5 upstream row", async () => {
    const provider = new MariaDbIdentityProvider(
      { ...baseEnv, authProvider: "mariadb", mariadbPasswordHashMode: "md5" },
      createFakeClient([
        {
          upstream_username: "editor.user",
          upstream_password_value: createHash("md5").update("plain-secret").digest("hex"),
          upstream_is_active: 1,
          upstream_full_name: "Editor User"
        }
      ])
    );

    const identity = await provider.authenticate({
      username: "editor.user",
      password: "plain-secret"
    });

    expect(identity.isActive).toBeTrue();
  });

  test("mariadb provider rejects invalid password deterministically", async () => {
    const passwordHash = await Bun.password.hash("correct-password");
    const provider = new MariaDbIdentityProvider(
      { ...baseEnv, authProvider: "mariadb", mariadbPasswordHashMode: "bcrypt" },
      createFakeClient([
        {
          upstream_username: "editor.user",
          upstream_password_value: passwordHash,
          upstream_is_active: 1,
          upstream_full_name: "Editor User"
        }
      ])
    );

    expect(
      provider.authenticate({
        username: "editor.user",
        password: "wrong-password"
      })
    ).rejects.toMatchObject({
      code: "AUTH_INVALID_CREDENTIALS",
      status: 401
    } satisfies Partial<AppError>);
  });

  test("mariadb provider rejects inactive upstream account", async () => {
    const passwordHash = await Bun.password.hash("correct-password");
    const provider = new MariaDbIdentityProvider(
      { ...baseEnv, authProvider: "mariadb", mariadbPasswordHashMode: "bcrypt" },
      createFakeClient([
        {
          upstream_username: "editor.user",
          upstream_password_value: passwordHash,
          upstream_is_active: 0,
          upstream_full_name: "Editor User"
        }
      ])
    );

    expect(
      provider.authenticate({
        username: "editor.user",
        password: "correct-password"
      })
    ).rejects.toMatchObject({
      code: "AUTH_ACCOUNT_INACTIVE",
      status: 401
    } satisfies Partial<AppError>);
  });

  test("mariadb provider rejects malformed upstream response", async () => {
    const provider = new MariaDbIdentityProvider(
      { ...baseEnv, authProvider: "mariadb", mariadbPasswordHashMode: "bcrypt" },
      createFakeClient([
        {
          upstream_username: "editor.user",
          upstream_password_value: "",
          upstream_is_active: 1,
          upstream_full_name: "Editor User"
        }
      ])
    );

    expect(
      provider.authenticate({
        username: "editor.user",
        password: "correct-password"
      })
    ).rejects.toMatchObject({
      code: "AUTH_PROVIDER_FAILURE",
      status: 503
    } satisfies Partial<AppError>);
  });

  test("mariadb provider maps upstream outages deterministically", async () => {
    const provider = new MariaDbIdentityProvider(
      { ...baseEnv, authProvider: "mariadb", mariadbPasswordHashMode: "bcrypt" },
      {
        query: async () => {
          throw new Error("upstream down");
        }
      }
    );

    expect(
      provider.authenticate({
        username: "editor.user",
        password: "correct-password"
      })
    ).rejects.toMatchObject({
      code: "AUTH_UPSTREAM_UNAVAILABLE",
      status: 503
    } satisfies Partial<AppError>);
  });

  test("mariadb provider supports integer username lookup with md5 mode", async () => {
    const metadataRows = [
      { COLUMN_NAME: "fingle_id", DATA_TYPE: "int" },
      { COLUMN_NAME: "hr_password", DATA_TYPE: "varchar" },
      { COLUMN_NAME: "hr_fname", DATA_TYPE: "varchar" },
      { COLUMN_NAME: "hr_laname", DATA_TYPE: "varchar" }
    ];
    const provider = new MariaDbIdentityProvider(
      {
        ...baseEnv,
        authProvider: "mariadb",
        mariadbAuthTable: "hr_person",
        mariadbUsernameColumn: "fingle_id",
        mariadbPasswordColumn: "hr_password",
        mariadbFullNameColumn: null,
        mariadbFirstNameColumn: "hr_fname",
        mariadbLastNameColumn: "hr_laname",
        mariadbActiveColumn: null,
        mariadbPasswordHashMode: "md5"
      },
      {
        async query<T>(sql: string, values: unknown[] = []): Promise<T[]> {
          if (sql.includes("information_schema.COLUMNS")) {
            return metadataRows as T[];
          }

          expect(values[0]).toBe(12345);
          return [
            {
              upstream_username: 12345,
              upstream_password_value: createHash("md5").update("plain-secret").digest("hex"),
              upstream_first_name: "Jane",
              upstream_last_name: "Doe"
            }
          ] as T[];
        }
      }
    );

    const identity = await provider.authenticate({
      username: "12345",
      password: "plain-secret"
    });

    expect(identity).toEqual({
      username: "12345",
      fullName: "Jane Doe",
      isActive: true
    });
  });

  test("mariadb provider rejects malformed integer username input", async () => {
    const metadataRows = [
      { COLUMN_NAME: "fingle_id", DATA_TYPE: "int" },
      { COLUMN_NAME: "hr_password", DATA_TYPE: "varchar" },
      { COLUMN_NAME: "hr_fname", DATA_TYPE: "varchar" },
      { COLUMN_NAME: "hr_laname", DATA_TYPE: "varchar" }
    ];
    const provider = new MariaDbIdentityProvider(
      {
        ...baseEnv,
        authProvider: "mariadb",
        mariadbAuthTable: "hr_person",
        mariadbUsernameColumn: "fingle_id",
        mariadbPasswordColumn: "hr_password",
        mariadbFullNameColumn: null,
        mariadbFirstNameColumn: "hr_fname",
        mariadbLastNameColumn: "hr_laname",
        mariadbActiveColumn: null,
        mariadbPasswordHashMode: "md5"
      },
      {
        async query<T>(sql: string): Promise<T[]> {
          if (sql.includes("information_schema.COLUMNS")) {
            return metadataRows as T[];
          }

          throw new Error("row query should not execute");
        }
      }
    );

    expect(
      provider.authenticate({
        username: "12x45",
        password: "plain-secret"
      })
    ).rejects.toMatchObject({
      code: "AUTH_INVALID_CREDENTIALS",
      status: 401
    } satisfies Partial<AppError>);
  });

  test("mariadb provider rejects malformed md5 digest", async () => {
    const provider = new MariaDbIdentityProvider(
      { ...baseEnv, authProvider: "mariadb", mariadbPasswordHashMode: "md5" },
      createFakeClient([
        {
          upstream_username: "editor.user",
          upstream_password_value: "BAD_DIGEST",
          upstream_is_active: 1,
          upstream_full_name: "Editor User"
        }
      ])
    );

    expect(
      provider.authenticate({
        username: "editor.user",
        password: "plain-secret"
      })
    ).rejects.toMatchObject({
      code: "AUTH_PROVIDER_FAILURE",
      status: 503
    } satisfies Partial<AppError>);
  });

  test("mariadb provider rejects null password values", async () => {
    const provider = new MariaDbIdentityProvider(
      { ...baseEnv, authProvider: "mariadb", mariadbPasswordHashMode: "md5" },
      createFakeClient([
        {
          upstream_username: "editor.user",
          upstream_password_value: null,
          upstream_is_active: 1,
          upstream_full_name: "Editor User"
        }
      ])
    );

    expect(
      provider.authenticate({
        username: "editor.user",
        password: "plain-secret"
      })
    ).rejects.toMatchObject({
      code: "AUTH_PROVIDER_FAILURE",
      status: 503
    } satisfies Partial<AppError>);
  });
});

function createFakeClient(rows: Array<Record<string, unknown>>): MariaDbQueryClient {
  return {
    async query<T>(sql: string): Promise<T[]> {
      if (sql.includes("information_schema.COLUMNS")) {
        return [
          { COLUMN_NAME: "username", DATA_TYPE: "varchar" },
          { COLUMN_NAME: "password_hash", DATA_TYPE: "varchar" },
          { COLUMN_NAME: "full_name", DATA_TYPE: "varchar" },
          { COLUMN_NAME: "is_active", DATA_TYPE: "tinyint" }
        ] as T[];
      }

      return rows as T[];
    }
  };
}
