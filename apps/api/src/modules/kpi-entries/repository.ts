import { PERMISSIONS } from "@healthcare-kpi-hub/config";
import type { Database } from "bun:sqlite";
import type { EntryValuePayload, KpiEntrySummary } from "@healthcare-kpi-hub/shared-types";

export interface KpiEntryCoreRecord {
  entry: KpiEntrySummary;
  definition_id: string;
  page_id: string;
  reporting_period_id: string;
}

interface KpiEntryCoreRow {
  entry_id: string;
  definition_id: string;
  page_id: string;
  reporting_period_id: string;
  status: string;
  assigned_to: string | null;
  due_at: string | null;
  updated_at: string;
  updated_by: string | null;
  role_can_update: number;
  period_status: string | null;
}

export function findKpiEntryCoreRecord(
  db: Database,
  entryId: string,
  currentUsername: string | null
): KpiEntryCoreRecord | null {
  const row = db
    .query(
      `SELECT
         e.id AS entry_id,
         e.kpi_definition_id AS definition_id,
         kd.kpi_page_id AS page_id,
         e.reporting_period_id AS reporting_period_id,
         e.status AS status,
         assigned.username AS assigned_to,
         e.due_at AS due_at,
         e.updated_at AS updated_at,
         updated_by.username AS updated_by,
         CASE
           WHEN EXISTS (
             SELECT 1
             FROM role_permissions rp2
             INNER JOIN users current_user ON current_user.role_code = rp2.role_code
             WHERE current_user.username = ?2
               AND rp2.permission_code = ?3
           ) THEN 1
           ELSE 0
         END AS role_can_update,
         rp.status AS period_status
       FROM kpi_entries e
       INNER JOIN kpi_definitions kd ON kd.id = e.kpi_definition_id
       LEFT JOIN reporting_periods rp ON rp.id = e.reporting_period_id
       LEFT JOIN users assigned ON assigned.id = e.assigned_to_user_id
       LEFT JOIN users updated_by ON updated_by.id = e.updated_by_user_id
       WHERE e.id = ?1`
    )
    .get(entryId, currentUsername, PERMISSIONS.KPI_UPDATE) as KpiEntryCoreRow | null;

  if (!row) {
    return null;
  }

  return {
    entry: {
      id: row.entry_id,
      status: row.status,
      assigned_to: row.assigned_to,
      due_at: row.due_at,
      updated_at: row.updated_at,
      updated_by: row.updated_by,
      editable:
        row.role_can_update === 1 &&
        row.period_status === "open" &&
        row.status !== "locked"
    },
    definition_id: row.definition_id,
    page_id: row.page_id,
    reporting_period_id: row.reporting_period_id
  };
}

export function findEntryValuePayload(
  db: Database,
  entryId: string
): EntryValuePayload {
  const row = db
    .query(
      `SELECT
         target_value,
         actual_value,
         progress_value,
         note,
         extra_json
       FROM entry_values
       WHERE kpi_entry_id = ?1`
    )
    .get(entryId) as EntryValuePayload | null;

  return (
    row ?? {
      target_value: null,
      actual_value: null,
      progress_value: null,
      note: null,
      extra_json: null
    }
  );
}
