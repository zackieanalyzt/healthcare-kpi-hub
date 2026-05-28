import * as mariadb from "mariadb";
import type { Pool, PoolConnection } from "mariadb";
import type { EnvConfig } from "../../infrastructure/config/env";
import { AppError } from "../../domain/shared/errors";
import { verifyMariaDbPassword } from "./password-verifier";

export interface UpstreamIdentity {
  username: string;
  fullName: string | null;
  isActive: boolean;
}

export interface AuthIdentityProvider {
  name: "dev" | "mariadb";
  authenticate(credentials: { username: string; password: string }): Promise<UpstreamIdentity>;
  close?(): Promise<void>;
}

interface MariaDbIdentityRow {
  upstream_username: string | number;
  upstream_password_value: string | null;
  upstream_first_name?: string | null;
  upstream_last_name?: string | null;
  upstream_full_name?: string | null;
  upstream_is_active?: number | boolean | null;
}

interface MariaDbColumnRow {
  COLUMN_NAME: string;
  DATA_TYPE: string;
}

interface MariaDbSchemaMetadata {
  availableColumns: string[];
  normalizedColumnNames: Set<string>;
  columnTypes: Record<string, string>;
  usernameColumnType: string | null;
  integerUsernameSupported: boolean;
  activeColumnPresent: boolean;
}

export interface MariaDbQueryClient {
  query<T>(sql: string, values?: unknown[]): Promise<T[]>;
  close?(): Promise<void>;
}

export interface MariaDbConnectivityReport {
  connection: "ok" | "fail";
  tableFound: boolean;
  requiredColumnsFound: boolean;
  activeColumnPresent: boolean;
  hashMode: string;
  availableColumns: string[];
  usernameColumnType: string | null;
  integerUsernameSupported: boolean;
}

export interface MariaDbSmokeUserCheck {
  smokeUserFound: boolean;
  matchingRows: number;
  passwordPresent: boolean;
  nameDataPresent: boolean;
}

export interface MariaDbIdentityLookupCheck {
  rowFound: boolean;
  passwordPresent: boolean;
  nameDataPresent: boolean;
}

export interface MariaDbPasswordModeProbe {
  md5Match: boolean | null;
}

const INTEGER_DATA_TYPES = new Set([
  "tinyint",
  "smallint",
  "mediumint",
  "int",
  "integer",
  "bigint"
]);

export class DevIdentityProvider implements AuthIdentityProvider {
  readonly name = "dev";

  constructor(private readonly env: EnvConfig) {}

  async authenticate(credentials: {
    username: string;
    password: string;
  }): Promise<UpstreamIdentity> {
    if (this.env.nodeEnv !== "development" && this.env.nodeEnv !== "test") {
      throw new AppError(
        "AUTH_UPSTREAM_UNAVAILABLE",
        "Authentication upstream is unavailable.",
        503
      );
    }

    if (credentials.password !== this.env.devAuthPassword) {
      throw new AppError(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid username or password.",
        401
      );
    }

    return {
      username: credentials.username,
      fullName: null,
      isActive: true
    };
  }
}

export class MariaDbIdentityProvider implements AuthIdentityProvider {
  readonly name = "mariadb";
  private schemaMetadataPromise: Promise<MariaDbSchemaMetadata> | null = null;

  constructor(
    private readonly env: EnvConfig,
    private readonly client: MariaDbQueryClient
  ) {}

  async authenticate(credentials: {
    username: string;
    password: string;
  }): Promise<UpstreamIdentity> {
    const normalizedUsername = credentials.username.trim();
    if (!normalizedUsername) {
      throw new AppError(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid username or password.",
        401
      );
    }

    const metadata = await this.getSchemaMetadata();
    const boundUsername = normalizeMariaDbUsername(normalizedUsername, metadata);
    if (boundUsername === null) {
      throw new AppError(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid username or password.",
        401
      );
    }

    const row = await this.findIdentityRow(boundUsername);

    if (!row) {
      throw new AppError(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid username or password.",
        401
      );
    }

    if (!row.upstream_password_value) {
      throw new AppError(
        "AUTH_PROVIDER_FAILURE",
        "Authentication provider returned an invalid response.",
        503
      );
    }

    const passwordMatches = await verifyMariaDbPassword(
      this.env.mariadbPasswordHashMode,
      credentials.password,
      row.upstream_password_value
    );

    if (!passwordMatches) {
      throw new AppError(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid username or password.",
        401
      );
    }

    const isActive = metadata.activeColumnPresent ? Boolean(row.upstream_is_active) : true;
    if (!isActive) {
      throw new AppError(
        "AUTH_ACCOUNT_INACTIVE",
        "This account is inactive.",
        401
      );
    }

    return {
      username: String(row.upstream_username).trim(),
      fullName: resolveFullName(row),
      isActive
    };
  }

  async close(): Promise<void> {
    if (this.client.close) {
      await this.client.close();
    }
  }

  private async findIdentityRow(
    username: string | number
  ): Promise<MariaDbIdentityRow | null> {
    const identifiers = resolveMariaDbIdentifiers(this.env);
    const selectedNameColumns = identifiers.fullName
      ? `${identifiers.fullName} AS upstream_full_name`
      : `${identifiers.firstName!} AS upstream_first_name, ${identifiers.lastName!} AS upstream_last_name`;
    const selectedActiveColumn = identifiers.active
      ? `, ${identifiers.active} AS upstream_is_active`
      : "";

    const sql = `SELECT ${identifiers.username} AS upstream_username, ${identifiers.password} AS upstream_password_value, ${selectedNameColumns}${selectedActiveColumn}
      FROM ${identifiers.table}
      WHERE ${identifiers.username} = ?
      LIMIT 1`;

    let rows: MariaDbIdentityRow[];
    try {
      rows = await this.client.query<MariaDbIdentityRow>(sql, [username]);
    } catch {
      throw new AppError(
        "AUTH_UPSTREAM_UNAVAILABLE",
        "Authentication upstream is unavailable.",
        503
      );
    }

    return rows[0] ?? null;
  }

  private async getSchemaMetadata(): Promise<MariaDbSchemaMetadata> {
    if (!this.schemaMetadataPromise) {
      this.schemaMetadataPromise = fetchMariaDbSchemaMetadata(this.env, this.client);
    }

    return this.schemaMetadataPromise;
  }
}

export function createAuthIdentityProvider(env: EnvConfig): AuthIdentityProvider {
  if (env.authProvider === "dev") {
    return new DevIdentityProvider(env);
  }

  return new MariaDbIdentityProvider(env, createMariaDbQueryClient(env));
}

export function createMariaDbQueryClient(env: EnvConfig): MariaDbQueryClient {
  const pool = createMariaDbPool(env);

  return {
    async query<T>(sql: string, values: unknown[] = []): Promise<T[]> {
      let connection: PoolConnection | null = null;
      try {
        const activeConnection = await pool.getConnection();
        connection = activeConnection;
        const result = await activeConnection.query(sql, values);
        return result as T[];
      } finally {
        if (connection) {
          connection.release();
        }
      }
    },
    async close(): Promise<void> {
      await pool.end();
    }
  };
}

export async function checkMariaDbConnectivity(
  env: EnvConfig,
  client: MariaDbQueryClient
): Promise<MariaDbConnectivityReport> {
  const metadata = await fetchMariaDbSchemaMetadata(env, client);
  const requiredColumns = [
    env.mariadbUsernameColumn,
    env.mariadbPasswordColumn,
    env.mariadbFullNameColumn,
    env.mariadbFirstNameColumn,
    env.mariadbLastNameColumn
  ].filter((column): column is string => Boolean(column));

  return {
    connection: "ok",
    tableFound: metadata.availableColumns.length > 0,
    requiredColumnsFound: requiredColumns.every((column) => hasColumn(metadata, column)),
    activeColumnPresent: metadata.activeColumnPresent,
    hashMode: env.mariadbPasswordHashMode,
    availableColumns: metadata.availableColumns,
    usernameColumnType: metadata.usernameColumnType,
    integerUsernameSupported: metadata.integerUsernameSupported
  };
}

export async function checkMariaDbSmokeUser(
  env: EnvConfig,
  client: MariaDbQueryClient,
  username: string
): Promise<MariaDbSmokeUserCheck> {
  const metadata = await fetchMariaDbSchemaMetadata(env, client);
  const normalizedUsername = normalizeMariaDbUsername(username.trim(), metadata);
  if (normalizedUsername === null) {
    return {
      smokeUserFound: false,
      matchingRows: 0,
      passwordPresent: false,
      nameDataPresent: false
    };
  }

  const identifiers = resolveMariaDbIdentifiers(env);
  const namePresenceSql = identifiers.fullName
    ? `CASE WHEN ${identifiers.fullName} IS NULL OR TRIM(${identifiers.fullName}) = '' THEN 0 ELSE 1 END`
    : `CASE WHEN (${identifiers.firstName!} IS NULL OR TRIM(${identifiers.firstName!}) = '') AND (${identifiers.lastName!} IS NULL OR TRIM(${identifiers.lastName!}) = '') THEN 0 ELSE 1 END`;

  const sql = `SELECT COUNT(*) AS matching_rows,
      SUM(CASE WHEN ${identifiers.password} IS NULL OR ${identifiers.password} = '' THEN 0 ELSE 1 END) AS password_present_count,
      SUM(${namePresenceSql}) AS name_present_count
    FROM ${identifiers.table}
    WHERE ${identifiers.username} = ?`;

  const rows = await client.query<{
    matching_rows: number | string;
    password_present_count: number | string | null;
    name_present_count: number | string | null;
  }>(sql, [normalizedUsername]);
  const row = rows[0];

  const matchingRows = Number(row?.matching_rows ?? 0);
  return {
    smokeUserFound: matchingRows > 0,
    matchingRows,
    passwordPresent: Number(row?.password_present_count ?? 0) > 0,
    nameDataPresent: Number(row?.name_present_count ?? 0) > 0
  };
}

export async function checkMariaDbIdentityLookup(
  env: EnvConfig,
  client: MariaDbQueryClient,
  username: string
): Promise<MariaDbIdentityLookupCheck> {
  const metadata = await fetchMariaDbSchemaMetadata(env, client);
  const normalizedUsername = normalizeMariaDbUsername(username.trim(), metadata);
  if (normalizedUsername === null) {
    return {
      rowFound: false,
      passwordPresent: false,
      nameDataPresent: false
    };
  }

  const identifiers = resolveMariaDbIdentifiers(env);
  const selectedNameColumns = identifiers.fullName
    ? `${identifiers.fullName} AS upstream_full_name`
    : `${identifiers.firstName!} AS upstream_first_name, ${identifiers.lastName!} AS upstream_last_name`;
  const selectedActiveColumn = identifiers.active
    ? `, ${identifiers.active} AS upstream_is_active`
    : "";
  const sql = `SELECT ${identifiers.username} AS upstream_username, ${identifiers.password} AS upstream_password_value, ${selectedNameColumns}${selectedActiveColumn}
    FROM ${identifiers.table}
    WHERE ${identifiers.username} = ?
    LIMIT 1`;

  const rows = await client.query<MariaDbIdentityRow>(sql, [normalizedUsername]);
  const row = rows[0];
  if (!row) {
    return {
      rowFound: false,
      passwordPresent: false,
      nameDataPresent: false
    };
  }

  return {
    rowFound: true,
    passwordPresent:
      typeof row.upstream_password_value === "string" &&
      row.upstream_password_value.length > 0,
    nameDataPresent: resolveFullName(row) !== null
  };
}

export async function checkMariaDbPasswordModeProbe(
  env: EnvConfig,
  client: MariaDbQueryClient,
  username: string,
  password: string
): Promise<MariaDbPasswordModeProbe> {
  if (env.mariadbPasswordHashMode !== "md5") {
    return {
      md5Match: null
    };
  }

  const metadata = await fetchMariaDbSchemaMetadata(env, client);
  const normalizedUsername = normalizeMariaDbUsername(username.trim(), metadata);
  if (normalizedUsername === null) {
    return {
      md5Match: false
    };
  }

  const identifiers = resolveMariaDbIdentifiers(env);
  const sql = `SELECT COUNT(*) AS matching_rows
    FROM ${identifiers.table}
    WHERE ${identifiers.username} = ?
      AND ${identifiers.password} = MD5(?)`;
  const rows = await client.query<{ matching_rows: number | string }>(sql, [
    normalizedUsername,
    password
  ]);

  return {
    md5Match: Number(rows[0]?.matching_rows ?? 0) > 0
  };
}

async function fetchMariaDbSchemaMetadata(
  env: EnvConfig,
  client: MariaDbQueryClient
): Promise<MariaDbSchemaMetadata> {
  const columns = await fetchMariaDbColumns(env, client);
  const availableColumns = columns.map((row) => row.COLUMN_NAME);
  const normalizedColumnNames = new Set(
    availableColumns.map((columnName) => columnName.toLowerCase())
  );
  const columnTypes = Object.fromEntries(
    columns.map((row) => [row.COLUMN_NAME.toLowerCase(), row.DATA_TYPE.toLowerCase()])
  );
  const usernameColumnType = columnTypes[env.mariadbUsernameColumn.toLowerCase()] ?? null;

  return {
    availableColumns,
    normalizedColumnNames,
    columnTypes,
    usernameColumnType,
    integerUsernameSupported:
      usernameColumnType !== null && INTEGER_DATA_TYPES.has(usernameColumnType),
    activeColumnPresent: env.mariadbActiveColumn
      ? normalizedColumnNames.has(env.mariadbActiveColumn.toLowerCase())
      : false
  };
}

async function fetchMariaDbColumns(
  env: EnvConfig,
  client: MariaDbQueryClient
): Promise<MariaDbColumnRow[]> {
  try {
    return await client.query<MariaDbColumnRow>(
      `SELECT COLUMN_NAME, DATA_TYPE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
         AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [env.mariadbDatabase!, env.mariadbAuthTable]
    );
  } catch {
    throw new AppError(
      "AUTH_UPSTREAM_UNAVAILABLE",
      "Authentication upstream is unavailable.",
      503
    );
  }
}

function createMariaDbPool(env: EnvConfig): Pool {
  return mariadb.createPool({
    host: env.mariadbHost!,
    port: env.mariadbPort!,
    database: env.mariadbDatabase!,
    user: env.mariadbUser!,
    password: env.mariadbPassword!,
    connectionLimit: 5,
    acquireTimeout: 5000
  });
}

function resolveMariaDbIdentifiers(env: EnvConfig) {
  return {
    table: escapeIdentifier(env.mariadbAuthTable),
    username: escapeIdentifier(env.mariadbUsernameColumn),
    password: escapeIdentifier(env.mariadbPasswordColumn),
    active: env.mariadbActiveColumn ? escapeIdentifier(env.mariadbActiveColumn) : null,
    fullName: env.mariadbFullNameColumn ? escapeIdentifier(env.mariadbFullNameColumn) : null,
    firstName: env.mariadbFirstNameColumn
      ? escapeIdentifier(env.mariadbFirstNameColumn)
      : null,
    lastName: env.mariadbLastNameColumn ? escapeIdentifier(env.mariadbLastNameColumn) : null
  };
}

function normalizeMariaDbUsername(
  username: string,
  metadata: MariaDbSchemaMetadata
): string | number | null {
  if (!metadata.integerUsernameSupported) {
    return username;
  }

  if (!/^\d+$/.test(username)) {
    return null;
  }

  const normalized = Number(username);
  return Number.isSafeInteger(normalized) ? normalized : null;
}

function hasColumn(metadata: MariaDbSchemaMetadata, columnName: string): boolean {
  return metadata.normalizedColumnNames.has(columnName.toLowerCase());
}

function resolveFullName(row: MariaDbIdentityRow): string | null {
  if (
    typeof row.upstream_full_name === "string" &&
    row.upstream_full_name.trim()
  ) {
    return row.upstream_full_name.trim();
  }

  const parts = [row.upstream_first_name, row.upstream_last_name]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : null;
}

function escapeIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new AppError(
      "AUTH_PROVIDER_FAILURE",
      "Authentication provider returned an invalid response.",
      503
    );
  }

  return `\`${identifier}\``;
}
