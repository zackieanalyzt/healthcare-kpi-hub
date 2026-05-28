import type { Database } from "bun:sqlite";

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
