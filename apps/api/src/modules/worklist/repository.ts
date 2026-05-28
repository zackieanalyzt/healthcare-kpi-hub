import { PERMISSIONS } from "@healthcare-kpi-hub/config";
import type { Database } from "bun:sqlite";

export interface WorklistQueryOptions {
  periodKey: string;
  page: number;
  pageSize: number;
  sort: "due_at" | "updated_at" | "status";
  mine: boolean;
  currentUsername: string | null;
}

export interface WorklistRow {
  entry_id: string;
  kpi_definition_id: string;
  kpi_code: string;
  kpi_name: string;
  page_id: string;
  page_name: string;
  workgroup_name: string;
  section_name: string;
  reporting_period_key: string;
  status: string;
  assigned_to: string | null;
  due_at: string | null;
  updated_at: string;
  period_status: string;
  role_can_update: number;
}

export function findCurrentPeriodKey(db: Database): string | null {
  const row = db
    .query(
      `SELECT period_key
       FROM reporting_periods
       WHERE status = 'open'
       ORDER BY starts_at DESC
       LIMIT 1`
    )
    .get() as { period_key: string } | null;

  return row?.period_key ?? null;
}

export function countWorklistRows(db: Database, options: WorklistQueryOptions): number {
  const row = db
    .query(
      `SELECT COUNT(*) AS total
       FROM kpi_entries e
       INNER JOIN reporting_periods rp ON rp.id = e.reporting_period_id
       INNER JOIN kpi_definitions kd ON kd.id = e.kpi_definition_id AND kd.is_active = 1
       INNER JOIN kpi_pages p ON p.id = kd.kpi_page_id AND p.is_active = 1
       INNER JOIN sections s ON s.id = p.section_id AND s.is_active = 1
       INNER JOIN workgroups w ON w.id = s.workgroup_id AND w.is_active = 1
       LEFT JOIN users assigned ON assigned.id = e.assigned_to_user_id
       WHERE rp.period_key = ?1
         AND (?2 = 0 OR assigned.username = ?3)`
    )
    .get(options.periodKey, options.mine ? 1 : 0, options.currentUsername) as { total: number };

  return row?.total ?? 0;
}

export function listWorklistRows(db: Database, options: WorklistQueryOptions): WorklistRow[] {
  const sortClause =
    options.sort === "due_at"
      ? "e.due_at ASC, e.updated_at DESC"
      : options.sort === "status"
        ? "e.status ASC, e.updated_at DESC"
        : "e.updated_at DESC";

  return db
    .query(
      `SELECT
         e.id AS entry_id,
         kd.id AS kpi_definition_id,
         kd.code AS kpi_code,
         kd.name AS kpi_name,
         p.id AS page_id,
         p.name AS page_name,
         w.name AS workgroup_name,
         s.name AS section_name,
         rp.period_key AS reporting_period_key,
         e.status AS status,
         assigned.username AS assigned_to,
         e.due_at AS due_at,
         e.updated_at AS updated_at,
         rp.status AS period_status,
         CASE
           WHEN EXISTS (
             SELECT 1
             FROM role_permissions rp2
             INNER JOIN users current_user ON current_user.role_code = rp2.role_code
             WHERE current_user.username = ?4
               AND rp2.permission_code = ?7
           )
           THEN 1
           ELSE 0
         END AS role_can_update
       FROM kpi_entries e
       INNER JOIN reporting_periods rp ON rp.id = e.reporting_period_id
       INNER JOIN kpi_definitions kd ON kd.id = e.kpi_definition_id AND kd.is_active = 1
       INNER JOIN kpi_pages p ON p.id = kd.kpi_page_id AND p.is_active = 1
       INNER JOIN sections s ON s.id = p.section_id AND s.is_active = 1
       INNER JOIN workgroups w ON w.id = s.workgroup_id AND w.is_active = 1
       LEFT JOIN users assigned ON assigned.id = e.assigned_to_user_id
       WHERE rp.period_key = ?1
         AND (?2 = 0 OR assigned.username = ?3)
       ORDER BY ${sortClause}
       LIMIT ?5 OFFSET ?6`
    )
    .all(
      options.periodKey,
      options.mine ? 1 : 0,
      options.currentUsername,
      options.currentUsername,
      options.pageSize,
      (options.page - 1) * options.pageSize,
      PERMISSIONS.KPI_UPDATE
    ) as WorklistRow[];
}
