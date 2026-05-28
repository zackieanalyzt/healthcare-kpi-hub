import type { Database } from "bun:sqlite";
import type { AuthenticatedUser, PermissionCode, RoleCode } from "@healthcare-kpi-hub/shared-types";
import type { SessionContext } from "../../app/types";

export interface PersistedUser extends AuthenticatedUser {
  last_login_at: string | null;
}

export interface PersistedSession extends SessionContext {
  token_hash: string;
  created_at: string;
}

export function findUserByUsername(db: Database, username: string): PersistedUser | null {
  const row = db
    .query(
      `SELECT id, username, full_name, role_code, is_active, last_login_at
       FROM users
       WHERE username = ?1`
    )
    .get(username) as
    | {
        id: string;
        username: string;
        full_name: string | null;
        role_code: RoleCode;
        is_active: number;
        last_login_at: string | null;
      }
    | null;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    role_code: row.role_code,
    permissions: findPermissionsByRoleCode(db, row.role_code),
    is_active: row.is_active === 1,
    last_login_at: row.last_login_at
  };
}

export function findUserById(db: Database, userId: string): PersistedUser | null {
  const row = db
    .query(
      `SELECT id, username, full_name, role_code, is_active, last_login_at
       FROM users
       WHERE id = ?1`
    )
    .get(userId) as
    | {
        id: string;
        username: string;
        full_name: string | null;
        role_code: RoleCode;
        is_active: number;
        last_login_at: string | null;
      }
    | null;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    role_code: row.role_code,
    permissions: findPermissionsByRoleCode(db, row.role_code),
    is_active: row.is_active === 1,
    last_login_at: row.last_login_at
  };
}

export function findPermissionsByRoleCode(
  db: Database,
  roleCode: RoleCode
): PermissionCode[] {
  const rows = db
    .query(
      `SELECT permission_code
       FROM role_permissions
       WHERE role_code = ?1
       ORDER BY permission_code`
    )
    .all(roleCode) as Array<{ permission_code: PermissionCode }>;

  return rows.map((row) => row.permission_code);
}

export function updateUserLastLogin(db: Database, userId: string, timestamp: string): void {
  db.query(
    `UPDATE users
     SET last_login_at = ?2, updated_at = ?2
     WHERE id = ?1`
  ).run(userId, timestamp);
}

export function createLocalUser(
  db: Database,
  user: {
    id: string;
    username: string;
    full_name: string | null;
    role_code: RoleCode;
    is_active: boolean;
    created_at: string;
  }
): void {
  db.query(
    `INSERT INTO users (
      id, username, full_name, role_code, is_active, created_at, updated_at, last_login_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, NULL)`
  ).run(
    user.id,
    user.username,
    user.full_name,
    user.role_code,
    user.is_active ? 1 : 0,
    user.created_at
  );
}

export function syncLocalUserIdentity(
  db: Database,
  userId: string,
  identity: {
    username: string;
    full_name: string | null;
    updated_at: string;
  }
): void {
  db.query(
    `UPDATE users
     SET username = ?2, full_name = ?3, updated_at = ?4
     WHERE id = ?1`
  ).run(userId, identity.username, identity.full_name, identity.updated_at);
}

export function createSessionRecord(
  db: Database,
  session: {
    id: string;
    user_id: string;
    username: string;
    token_hash: string;
    expires_at: string;
    created_at: string;
    last_seen_at: string | null;
    revoked_at: string | null;
  }
): void {
  db.query(
    `INSERT INTO sessions (
      id, user_id, username, token_hash, expires_at, created_at, last_seen_at, revoked_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
  ).run(
    session.id,
    session.user_id,
    session.username,
    session.token_hash,
    session.expires_at,
    session.created_at,
    session.last_seen_at,
    session.revoked_at
  );
}

export function findSessionByTokenHash(db: Database, tokenHash: string): PersistedSession | null {
  return db
    .query(
      `SELECT id, user_id, username, token_hash, expires_at, created_at, last_seen_at, revoked_at
       FROM sessions
       WHERE token_hash = ?1`
    )
    .get(tokenHash) as PersistedSession | null;
}

export function touchSession(db: Database, sessionId: string, timestamp: string): void {
  db.query(
    `UPDATE sessions
     SET last_seen_at = ?2
     WHERE id = ?1`
  ).run(sessionId, timestamp);
}

export function revokeSession(db: Database, sessionId: string, timestamp: string): void {
  db.query(
    `UPDATE sessions
     SET revoked_at = ?2
     WHERE id = ?1`
  ).run(sessionId, timestamp);
}

export function revokeAllSessionsForUser(
  db: Database,
  userId: string,
  timestamp: string,
  excludeSessionId?: string | null
): number {
  const result = excludeSessionId
    ? db
        .query(
          `UPDATE sessions
           SET revoked_at = ?2
           WHERE user_id = ?1
             AND revoked_at IS NULL
             AND id != ?3`
        )
        .run(userId, timestamp, excludeSessionId)
    : db
        .query(
          `UPDATE sessions
           SET revoked_at = ?2
           WHERE user_id = ?1
             AND revoked_at IS NULL`
        )
        .run(userId, timestamp);

  return Number(result.changes ?? 0);
}
