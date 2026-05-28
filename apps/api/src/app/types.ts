import type { AuthenticatedUser } from "@healthcare-kpi-hub/shared-types";
import type { AppLogger } from "../infrastructure/logging/logger";
import type { EnvConfig } from "../infrastructure/config/env";
import type { Database } from "bun:sqlite";
import type { AuthIdentityProvider } from "../modules/auth/provider";

export interface SessionContext {
  id: string;
  user_id: string;
  username: string;
  expires_at: string;
  last_seen_at: string | null;
  revoked_at: string | null;
}

export interface AppContext {
  requestId: string;
  logger: AppLogger;
  env: EnvConfig;
  db: Database;
  identityProvider: AuthIdentityProvider;
  user: AuthenticatedUser | null;
  session: SessionContext | null;
}

export interface AppDependencies {
  env: EnvConfig;
  logger: AppLogger;
  db: Database;
  identityProvider: AuthIdentityProvider;
}
