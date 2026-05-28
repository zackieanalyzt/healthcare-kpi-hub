import { parseCookies } from "../../infrastructure/http/cookies";
import type { AppDependencies, SessionContext } from "../types";
import type { AuthenticatedUser } from "@healthcare-kpi-hub/shared-types";
import { resolveAuthenticatedSession } from "../../modules/auth/service";

export async function resolveSessionUser(
  request: Request,
  dependencies: Pick<AppDependencies, "db" | "env">
): Promise<{ user: AuthenticatedUser | null; session: SessionContext | null }> {
  const cookies = parseCookies(request.headers.get("cookie"));
  const rawSessionToken = cookies[dependencies.env.sessionCookieName] ?? null;
  const resolved = await resolveAuthenticatedSession(
    dependencies.db,
    dependencies.env,
    rawSessionToken
  );

  if (!resolved) {
    return {
      user: null,
      session: null
    };
  }

  const { session } = resolved;

  return {
    user: resolved.user,
    session: {
      id: session.id,
      user_id: session.user_id,
      username: session.username,
      expires_at: session.expires_at,
      last_seen_at: session.last_seen_at,
      revoked_at: session.revoked_at
    }
  };
}
