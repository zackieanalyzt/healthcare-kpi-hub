import { timingSafeEqual } from "node:crypto";
import type { Database } from "bun:sqlite";
import { DEFAULT_ROLE } from "@healthcare-kpi-hub/config";
import type { AuthenticatedUser } from "@healthcare-kpi-hub/shared-types";
import type { EnvConfig } from "../../infrastructure/config/env";
import { AppError } from "../../domain/shared/errors";
import { generateSessionToken, hashSessionToken } from "../../infrastructure/session/token";
import type { AuthIdentityProvider, UpstreamIdentity } from "./provider";
import {
  createLocalUser,
  createSessionRecord,
  findSessionByTokenHash,
  findUserById,
  findUserByUsername,
  revokeAllSessionsForUser,
  revokeSession,
  syncLocalUserIdentity,
  touchSession,
  updateUserLastLogin,
  type PersistedSession
} from "./repository";

export interface LoginResult {
  user: AuthenticatedUser;
  sessionToken: string;
  csrfToken: string;
}

export interface AuthCookieDescriptor {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: EnvConfig["sessionCookieSameSite"];
  path: string;
  maxAgeSeconds: number;
}

export interface AuthCookieBundle {
  session: AuthCookieDescriptor;
  csrf: AuthCookieDescriptor;
}

export async function loginUser(
  db: Database,
  env: EnvConfig,
  identityProvider: AuthIdentityProvider,
  username: string,
  password: string
): Promise<LoginResult> {
  const normalizedUsername = username.trim();
  const now = new Date();
  const nowIso = now.toISOString();
  const upstreamIdentity = await identityProvider.authenticate({
    username: normalizedUsername,
    password
  });

  if (!upstreamIdentity.isActive) {
    throw new AppError(
      "AUTH_ACCOUNT_INACTIVE",
      "This account is inactive.",
      401
    );
  }

  const user = db.transaction(() =>
    resolveOrProvisionLocalUser(db, upstreamIdentity, nowIso)
  )();

  if (!user.is_active) {
    throw new AppError(
      "AUTH_ACCOUNT_INACTIVE",
      "This account is inactive.",
      401
    );
  }

  const sessionToken = generateSessionToken();
  const csrfToken = generateSessionToken();
  const tokenHash = await hashSessionToken(sessionToken);
  const expiresAt = new Date(
    now.getTime() + env.sessionAbsoluteLifetimeHours * 60 * 60 * 1000
  ).toISOString();

  db.transaction(() => {
    updateUserLastLogin(db, user.id, nowIso);
    createSessionRecord(db, {
      id: `ses_${crypto.randomUUID()}`,
      user_id: user.id,
      username: user.username,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_at: nowIso,
      last_seen_at: nowIso,
      revoked_at: null
    });
  })();

  return {
    user: {
      ...user,
      last_login_at: nowIso
    },
    sessionToken,
    csrfToken
  };
}

export async function resolveAuthenticatedSession(
  db: Database,
  env: EnvConfig,
  rawSessionToken: string | null
): Promise<{ user: AuthenticatedUser; session: PersistedSession } | null> {
  if (!rawSessionToken) {
    return null;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const tokenHash = await hashSessionToken(rawSessionToken);
  const session = findSessionByTokenHash(db, tokenHash);
  if (!session) {
    return null;
  }

  if (!timingSafeEquals(session.token_hash, tokenHash)) {
    return null;
  }

  if (session.revoked_at) {
    return null;
  }

  if (isSessionExpired(session, env, now)) {
    revokeSession(db, session.id, nowIso);
    return null;
  }

  const user = findUserById(db, session.user_id);
  if (!user || !user.is_active) {
    revokeSession(db, session.id, nowIso);
    return null;
  }

  if (shouldTouchSession(session.last_seen_at, now)) {
    touchSession(db, session.id, nowIso);
    session.last_seen_at = nowIso;
  }

  return { user, session };
}

export function logoutSession(db: Database, sessionId: string): void {
  revokeSession(db, sessionId, new Date().toISOString());
}

export function revokeAllUserSessions(
  db: Database,
  userId: string,
  excludeSessionId?: string | null
): number {
  return revokeAllSessionsForUser(db, userId, new Date().toISOString(), excludeSessionId);
}

export function buildAuthCookieBundle(
  env: EnvConfig,
  sessionToken: string,
  csrfToken: string,
  maxAgeSeconds = env.sessionAbsoluteLifetimeHours * 60 * 60
): AuthCookieBundle {
  return {
    session: {
      name: env.sessionCookieName,
      value: sessionToken,
      httpOnly: true,
      secure: env.sessionCookieSecure,
      sameSite: env.sessionCookieSameSite,
      path: env.sessionCookiePath,
      maxAgeSeconds
    },
    csrf: {
      name: env.csrfCookieName,
      value: csrfToken,
      httpOnly: false,
      secure: env.sessionCookieSecure,
      sameSite: env.csrfCookieSameSite,
      path: env.sessionCookiePath,
      maxAgeSeconds
    }
  };
}

export function buildExpiredAuthCookieBundle(env: EnvConfig): AuthCookieBundle {
  return buildAuthCookieBundle(env, "", "", 0);
}

function resolveOrProvisionLocalUser(
  db: Database,
  upstreamIdentity: UpstreamIdentity,
  nowIso: string
): AuthenticatedUser {
  const existing = findUserByUsername(db, upstreamIdentity.username);
  if (existing) {
    if (!existing.is_active) {
      return existing;
    }

    syncLocalUserIdentity(db, existing.id, {
      username: upstreamIdentity.username,
      full_name: upstreamIdentity.fullName,
      updated_at: nowIso
    });

    return {
      ...existing,
      full_name: upstreamIdentity.fullName
    };
  }

  const createdId = `usr_${crypto.randomUUID()}`;
  createLocalUser(db, {
    id: createdId,
    username: upstreamIdentity.username,
    full_name: upstreamIdentity.fullName,
    role_code: DEFAULT_ROLE,
    is_active: true,
    created_at: nowIso
  });

  const created = findUserById(db, createdId);
  if (!created) {
    throw new AppError(
      "AUTH_PROVIDER_FAILURE",
      "Authentication provider returned an invalid response.",
      503
    );
  }

  return created;
}

function isSessionExpired(
  session: Pick<PersistedSession, "expires_at" | "last_seen_at" | "created_at">,
  env: EnvConfig,
  now: Date
): boolean {
  if (new Date(session.expires_at).getTime() <= now.getTime()) {
    return true;
  }

  const referenceTimestamp = session.last_seen_at ?? session.created_at;
  const idleDeadline =
    new Date(referenceTimestamp).getTime() + env.sessionIdleTimeoutHours * 60 * 60 * 1000;

  return idleDeadline <= now.getTime();
}

function shouldTouchSession(lastSeenAt: string | null, now: Date): boolean {
  if (!lastSeenAt) {
    return true;
  }

  return now.getTime() - new Date(lastSeenAt).getTime() >= 5 * 60 * 1000;
}

function timingSafeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
