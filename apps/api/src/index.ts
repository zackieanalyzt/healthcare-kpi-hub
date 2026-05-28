import { createApiServer } from "./app/server";
import { loadEnv } from "./infrastructure/config/env";
import { createLogger } from "./infrastructure/logging/logger";
import { createSqliteConnection } from "./infrastructure/sqlite/client";
import { ensureSqliteDirectory } from "./infrastructure/sqlite/runner";
import { createAuthIdentityProvider } from "./modules/auth/provider";

const env = loadEnv();
const logger = createLogger({
  level: env.logLevel,
  service: "api"
});
ensureSqliteDirectory(env.sqlitePath);
const db = createSqliteConnection({ path: env.sqlitePath });
const identityProvider = createAuthIdentityProvider(env);

const server = createApiServer({ env, logger, db, identityProvider });

logger.info("api.starting", {
  port: env.apiPort,
  nodeEnv: env.nodeEnv,
  auth_provider: env.authProvider
});
