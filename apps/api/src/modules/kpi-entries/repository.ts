import { PERMISSIONS } from "@healthcare-kpi-hub/config";
import type { Database } from "bun:sqlite";
import type { EntryValuePayload, KpiEntrySummary } from "@healthcare-kpi-hub/shared-types";

export interface KpiEntryCoreRecord {
  entry: KpiEntrySummary;
  definition_id: string;
  page_id: string;
  reporting_period_id: string;
}

export interface KpiEntryMutationRecord {
  entry_id: string;
  definition_id: string;
  page_id: string;
  reporting_period_id: string;
  status: string;
  assigned_to_user_id: string | null;
  due_at: string | null;
  updated_at: string;
  updated_by_user_id: string | null;
  created_at: string;
  definition_code: string;
  definition_name: string;
  definition_value_type: string;
  definition_preset_code: string;
  definition_owner_label: string | null;
  reporting_period_status: string | null;
  entry_value_id: string | null;
  target_value: string | null;
  actual_value: string | null;
  progress_value: number | null;
  note: string | null;
  extra_json: string | null;
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

interface KpiEntryMutationRow {
  entry_id: string;
  definition_id: string;
  page_id: string;
  reporting_period_id: string;
  status: string;
  assigned_to_user_id: string | null;
  due_at: string | null;
  updated_at: string;
  updated_by_user_id: string | null;
  created_at: string;
  definition_code: string;
  definition_name: string;
  definition_value_type: string;
  definition_preset_code: string;
  definition_owner_label: string | null;
  reporting_period_status: string | null;
  entry_value_id: string | null;
  target_value: string | null;
  actual_value: string | null;
  progress_value: number | null;
  note: string | null;
  extra_json: string | null;
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

export function findKpiEntryMutationRecord(
  db: Database,
  entryId: string
): KpiEntryMutationRecord | null {
  const row = db
    .query(
      `SELECT
         e.id AS entry_id,
         e.kpi_definition_id AS definition_id,
         kd.kpi_page_id AS page_id,
         e.reporting_period_id AS reporting_period_id,
         e.status AS status,
         e.assigned_to_user_id AS assigned_to_user_id,
         e.due_at AS due_at,
         e.updated_at AS updated_at,
         e.updated_by_user_id AS updated_by_user_id,
         e.created_at AS created_at,
         kd.code AS definition_code,
         kd.name AS definition_name,
         kd.value_type AS definition_value_type,
         kd.preset_code AS definition_preset_code,
         kd.owner_label AS definition_owner_label,
         rp.status AS reporting_period_status,
         ev.id AS entry_value_id,
         ev.target_value AS target_value,
         ev.actual_value AS actual_value,
         ev.progress_value AS progress_value,
         ev.note AS note,
         ev.extra_json AS extra_json
       FROM kpi_entries e
       INNER JOIN kpi_definitions kd ON kd.id = e.kpi_definition_id
       LEFT JOIN reporting_periods rp ON rp.id = e.reporting_period_id
       LEFT JOIN entry_values ev ON ev.kpi_entry_id = e.id
       WHERE e.id = ?1`
    )
    .get(entryId) as KpiEntryMutationRow | null;

  if (!row) {
    return null;
  }

  return {
    entry_id: row.entry_id,
    definition_id: row.definition_id,
    page_id: row.page_id,
    reporting_period_id: row.reporting_period_id,
    status: row.status,
    assigned_to_user_id: row.assigned_to_user_id,
    due_at: row.due_at,
    updated_at: row.updated_at,
    updated_by_user_id: row.updated_by_user_id,
    created_at: row.created_at,
    definition_code: row.definition_code,
    definition_name: row.definition_name,
    definition_value_type: row.definition_value_type,
    definition_preset_code: row.definition_preset_code,
    definition_owner_label: row.definition_owner_label,
    reporting_period_status: row.reporting_period_status,
    entry_value_id: row.entry_value_id,
    target_value: row.target_value,
    actual_value: row.actual_value,
    progress_value: row.progress_value,
    note: row.note,
    extra_json: row.extra_json
  };
}

export function updateKpiEntryRecord(
  db: Database,
  entryId: string,
  status: string,
  updatedAt: string,
  updatedByUserId: string
): void {
  db.query(
    `UPDATE kpi_entries
     SET status = ?2,
         updated_at = ?3,
         updated_by_user_id = ?4
     WHERE id = ?1`
  ).run(entryId, status, updatedAt, updatedByUserId);
}

export function upsertEntryValueRecord(
  db: Database,
  params: {
    id: string;
    entryId: string;
    targetValue: string | null;
    actualValue: string | null;
    progressValue: number | null;
    note: string | null;
    extraJson: string | null;
    updatedAt: string;
  }
): void {
  db.query(
    `INSERT INTO entry_values (
       id,
       kpi_entry_id,
       target_value,
       actual_value,
       progress_value,
       note,
       extra_json,
       updated_at
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
     ON CONFLICT(kpi_entry_id) DO UPDATE SET
       actual_value = excluded.actual_value,
       progress_value = excluded.progress_value,
       note = excluded.note,
       updated_at = excluded.updated_at`
  ).run(
    params.id,
    params.entryId,
    params.targetValue,
    params.actualValue,
    params.progressValue,
    params.note,
    params.extraJson,
    params.updatedAt
  );
}
