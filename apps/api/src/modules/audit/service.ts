import type { Database } from "bun:sqlite";
import type { AuditHistoryItem } from "@healthcare-kpi-hub/shared-types";
import { insertAuditEvent, listRecentAuditHistoryForEntity } from "./repository";

export function recordAuditEvent(
  db: Database,
  event: {
    entityType: string;
    entityId: string;
    action: string;
    actorUserId?: string | null;
    actorUsername?: string | null;
    payload?: Record<string, unknown> | null;
  }
): void {
  insertAuditEvent(db, {
    id: `aud_${crypto.randomUUID()}`,
    entity_type: event.entityType,
    entity_id: event.entityId,
    action: event.action,
    actor_user_id: event.actorUserId ?? null,
    actor_username: event.actorUsername ?? null,
    occurred_at: new Date().toISOString(),
    payload_json: event.payload ? JSON.stringify(event.payload) : null
  });
}

export function getRecentAuditHistoryForEntity(
  db: Database,
  entityType: string,
  entityId: string,
  limit = 10
): AuditHistoryItem[] {
  return listRecentAuditHistoryForEntity(db, entityType, entityId, limit);
}
