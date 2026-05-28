import { describe, expect, test } from "bun:test";
import { dispatchRoute } from "./router";
import type { AppContext } from "./types";
import { createLogger } from "../infrastructure/logging/logger";
import { loadEnv } from "../infrastructure/config/env";
import { createSqliteConnection } from "../infrastructure/sqlite/client";
import { createAuthIdentityProvider } from "../modules/auth/provider";

function createContext(): AppContext {
  const env = loadEnv();
  return {
    requestId: "req_test",
    logger: createLogger({ level: "ERROR", service: "test" }),
    env,
    db: createSqliteConnection({ path: ":memory:" }),
    identityProvider: createAuthIdentityProvider(env),
    user: null,
    session: null
  };
}

describe("router", () => {
  test("returns 200 for healthz", async () => {
    const response = await dispatchRoute(
      new Request("http://localhost/healthz", { method: "GET" }),
      "/healthz",
      createContext()
    );

    expect(response.status).toBe(200);
  });

  test("returns 404 for unknown route", async () => {
    const response = await dispatchRoute(
      new Request("http://localhost/unknown", { method: "GET" }),
      "/unknown",
      createContext()
    );

    expect(response.status).toBe(404);
  });
});
