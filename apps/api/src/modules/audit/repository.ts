import type { Database } from "bun:sqlite";
import type { AuditHistoryItem } from "@healthcare-kpi-hub/shared-types";

export function insertAuditEvent(
  db: Database,
  event: {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    actor_user_id: string | null;
    actor_username: string | null;
    occurred_at: string;
    payload_json: string | null;
  }
): void {
  db.query(
    `INSERT INTO audit_events (
      id, entity_type, entity_id, action, actor_user_id, actor_username, occurred_at, payload_json
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
  ).run(
    event.id,
    event.entity_type,
    event.entity_id,
    event.action,
    event.actor_user_id,
    event.actor_username,
    event.occurred_at,
    event.payload_json
  );
}

interface AuditHistoryRow {
  audit_event_id: string;
  action: string;
  actor_username: string | null;
  occurred_at: string;
  payload_json: string | null;
}

export function listRecentAuditHistoryForEntity(
  db: Database,
  entityType: string,
  entityId: string,
  limit = 10
): AuditHistoryItem[] {
  const rows = db
    .query(
      `SELECT
         id AS audit_event_id,
         action,
         actor_username,
         occurred_at,
         payload_json
       FROM audit_events
       WHERE entity_type = ?1
         AND entity_id = ?2
       ORDER BY occurred_at DESC
       LIMIT ?3`
    )
    .all(entityType, entityId, limit) as AuditHistoryRow[];

  return rows.map((row) => {
    let summary: string | null = null;

    if (row.payload_json) {
      try {
        const payload = JSON.parse(row.payload_json) as { summary?: unknown };
        summary = typeof payload.summary === "string" ? payload.summary : null;
      } catch {
        summary = null;
      }
    }

    return {
      audit_event_id: row.audit_event_id,
      action: row.action,
      actor_username: row.actor_username,
      occurred_at: row.occurred_at,
      summary
    };
  });
}
