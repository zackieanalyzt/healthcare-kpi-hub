import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Database } from "bun:sqlite";
import { resolveSqliteDirectory } from "./paths";

export function ensureSqliteDirectory(sqlitePath: string): void {
  mkdirSync(resolveSqliteDirectory(sqlitePath), { recursive: true });
}

export function ensureMigrationTable(database: Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

export function getSortedSqlFiles(directory: string): string[] {
  return readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));
}

export function runSqlDirectory(
  database: Database,
  directory: string,
  options: { trackMigrations: boolean }
): string[] {
  const applied: string[] = [];
  const files = getSortedSqlFiles(directory);

  for (const file of files) {
    if (options.trackMigrations) {
      const existing = database
        .query("SELECT name FROM schema_migrations WHERE name = ?1")
        .get(file) as { name: string } | null;

      if (existing) {
        continue;
      }
    }

    const sql = readFileSync(join(directory, file), "utf8");
    database.transaction(() => {
      database.exec(sql);

      if (options.trackMigrations) {
        database
          .query(
            "INSERT INTO schema_migrations (name, applied_at) VALUES (?1, ?2)"
          )
          .run(file, new Date().toISOString());
      }
    })();

    applied.push(file);
  }

  return applied;
}
