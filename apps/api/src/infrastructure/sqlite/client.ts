import { Database } from "bun:sqlite";

export interface SqliteConnectionConfig {
  path: string;
}

export function createSqliteConnection(config: SqliteConnectionConfig): Database {
  const database = new Database(config.path, { create: true });

  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA synchronous = NORMAL;");
  database.exec("PRAGMA busy_timeout = 5000;");

  return database;
}
