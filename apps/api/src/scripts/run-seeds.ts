import { createSqliteConnection } from "../infrastructure/sqlite/client";
import { loadEnv } from "../infrastructure/config/env";
import { createLogger } from "../infrastructure/logging/logger";
import { ensureSqliteDirectory, runSqlDirectory } from "../infrastructure/sqlite/runner";
import { resolveSeedDirectory } from "../infrastructure/sqlite/paths";

const env = loadEnv();
const logger = createLogger({
  level: env.logLevel,
  service: "api-seed"
});

ensureSqliteDirectory(env.sqlitePath);
const db = createSqliteConnection({ path: env.sqlitePath });

const applied = runSqlDirectory(db, resolveSeedDirectory(), {
  trackMigrations: false
});

logger.info("db.seed.completed", {
  sqlite_path: env.sqlitePath,
  applied_count: applied.length,
  applied
});
