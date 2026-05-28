import { join } from "node:path";

export function resolveSqliteDirectory(sqlitePath: string): string {
  const normalizedPath = sqlitePath.replace(/\\/g, "/");
  const lastSlash = normalizedPath.lastIndexOf("/");

  if (lastSlash === -1) {
    return ".";
  }

  return normalizedPath.slice(0, lastSlash) || ".";
}

export function resolveMigrationDirectory(): string {
  return join(import.meta.dir, "migrations");
}

export function resolveSeedDirectory(): string {
  return join(import.meta.dir, "seeds");
}
