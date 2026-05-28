import { createSqliteConnection } from "../infrastructure/sqlite/client";
import { loadEnv } from "../infrastructure/config/env";
import { createLogger } from "../infrastructure/logging/logger";
import {
  ensureMigrationTable,
  ensureSqliteDirectory,
  runSqlDirectory
} from "../infrastructure/sqlite/runner";
import { resolveMigrationDirectory } from "../infrastructure/sqlite/paths";

const env = loadEnv();
const logger = createLogger({
  level: env.logLevel,
  service: "api-migrate"
});

ensureSqliteDirectory(env.sqlitePath);
const db = createSqliteConnection({ path: env.sqlitePath });
ensureMigrationTable(db);

const applied = runSqlDirectory(db, resolveMigrationDirectory(), {
  trackMigrations: true
});

logger.info("db.migrate.completed", {
  sqlite_path: env.sqlitePath,
  applied_count: applied.length,
  applied
});
