import {
  DASHBOARD_REPORTING_PERIOD_STATUSES,
  DASHBOARD_SCOPES
} from "@healthcare-kpi-hub/config";
import type { Database } from "bun:sqlite";

export interface DashboardReportingPeriodRecord {
  id: string;
  period_key: string;
  status: string;
  starts_at: string;
  ends_at: string;
}

export interface DashboardOrganizationScopeRecord {
  page_id: string;
  page_name: string;
}

export interface DashboardOrganizationEntryRecord {
  definition_id: string;
  definition_code: string;
  definition_name: string;
  page_id: string;
  page_name: string;
  hierarchy_level: string | null;
  entry_id: string;
  entry_status: string;
  due_at: string | null;
  entry_updated_at: string;
  definition_updated_at: string;
  measurement_type: string | null;
  measurement_unit: string | null;
  target_operator: string | null;
  target_value: string | null;
  target_direction: string | null;
  target_annotation: string | null;
  aggregation_method: string | null;
  threshold_rules: string | null;
  milestone_levels: string | null;
  numerator_label: string | null;
  denominator_label: string | null;
  denominator_source: string | null;
  default_denominator_value: string | null;
  calculation_formula_label: string | null;
  preferred_chart_type: string | null;
  actual_value: string | null;
  progress_value: number | null;
  assigned_to_user_id: string | null;
}

export function findDashboardReportingPeriod(
  db: Database,
  periodKey?: string
): DashboardReportingPeriodRecord | null {
  if (periodKey) {
    return (
      (db
        .query(
          `SELECT id, period_key, status, starts_at, ends_at
           FROM reporting_periods
           WHERE period_key = ?1`
        )
        .get(periodKey) as DashboardReportingPeriodRecord | null) ?? null
    );
  }

  return (
    (db
      .query(
        `SELECT id, period_key, status, starts_at, ends_at
         FROM reporting_periods
         WHERE status = ?1
         ORDER BY starts_at DESC
         LIMIT 1`
      )
      .get(DASHBOARD_REPORTING_PERIOD_STATUSES.OPEN) as
        | DashboardReportingPeriodRecord
        | null) ?? null
  );
}

export function findOrganizationScopeRoot(
  db: Database
): DashboardOrganizationScopeRecord | null {
  return (
    (db
      .query(
        `SELECT
           p.id AS page_id,
           p.name AS page_name
         FROM kpi_page_hierarchy h
         INNER JOIN kpi_pages p
           ON p.id = h.kpi_page_id
          AND p.is_active = 1
         WHERE h.hierarchy_level = ?1
         ORDER BY h.sort_order, p.sort_order, p.name
         LIMIT 1`
      )
      .get(DASHBOARD_SCOPES.ORGANIZATION) as
        | DashboardOrganizationScopeRecord
        | null) ?? null
  );
}

export function listOrganizationEntryRecords(
  db: Database,
  organizationPageId: string,
  reportingPeriodId: string
): DashboardOrganizationEntryRecord[] {
  return db
    .query(
      `WITH RECURSIVE hierarchy_scope(page_id) AS (
         SELECT ?1
         UNION ALL
         SELECT child.kpi_page_id
         FROM kpi_page_hierarchy child
         INNER JOIN hierarchy_scope parent_scope
           ON parent_scope.page_id = child.parent_kpi_page_id
       )
       SELECT
         kd.id AS definition_id,
         kd.code AS definition_code,
         kd.name AS definition_name,
         p.id AS page_id,
         p.name AS page_name,
         h.hierarchy_level AS hierarchy_level,
         e.id AS entry_id,
         e.status AS entry_status,
         e.due_at AS due_at,
         e.updated_at AS entry_updated_at,
         kd.updated_at AS definition_updated_at,
         kd.measurement_type AS measurement_type,
         kd.measurement_unit AS measurement_unit,
         kd.target_operator AS target_operator,
         kd.target_value AS target_value,
         kd.target_direction AS target_direction,
         kd.target_annotation AS target_annotation,
         kd.aggregation_method AS aggregation_method,
         kd.threshold_rules AS threshold_rules,
         kd.milestone_levels AS milestone_levels,
         kd.numerator_label AS numerator_label,
         kd.denominator_label AS denominator_label,
         kd.denominator_source AS denominator_source,
         kd.default_denominator_value AS default_denominator_value,
         kd.calculation_formula_label AS calculation_formula_label,
         kd.preferred_chart_type AS preferred_chart_type,
         ev.actual_value AS actual_value,
         ev.progress_value AS progress_value,
         e.assigned_to_user_id AS assigned_to_user_id
       FROM hierarchy_scope scope
       INNER JOIN kpi_pages p
         ON p.id = scope.page_id
        AND p.is_active = 1
       INNER JOIN kpi_definitions kd
         ON kd.kpi_page_id = p.id
        AND kd.is_active = 1
       INNER JOIN kpi_entries e
         ON e.kpi_definition_id = kd.id
        AND e.reporting_period_id = ?2
       LEFT JOIN entry_values ev
         ON ev.kpi_entry_id = e.id
       LEFT JOIN kpi_page_hierarchy h
         ON h.kpi_page_id = p.id
       ORDER BY p.name, kd.sort_order, kd.name`
    )
    .all(organizationPageId, reportingPeriodId) as DashboardOrganizationEntryRecord[];
}

export interface DashboardAmbiguousScopeRecord {
  definition_id: string;
  entry_id: string;
  page_id: string;
  page_name: string;
}

export function listAmbiguousScopeRecords(
  db: Database,
  organizationPageId: string,
  reportingPeriodId: string
): DashboardAmbiguousScopeRecord[] {
  return db
    .query(
      `WITH RECURSIVE hierarchy_scope(page_id) AS (
         SELECT ?1
         UNION ALL
         SELECT child.kpi_page_id
         FROM kpi_page_hierarchy child
         INNER JOIN hierarchy_scope parent_scope
           ON parent_scope.page_id = child.parent_kpi_page_id
       )
       SELECT
         kd.id AS definition_id,
         e.id AS entry_id,
         p.id AS page_id,
         p.name AS page_name
       FROM kpi_entries e
       INNER JOIN kpi_definitions kd
         ON kd.id = e.kpi_definition_id
        AND kd.is_active = 1
       INNER JOIN kpi_pages p
         ON p.id = kd.kpi_page_id
        AND p.is_active = 1
       LEFT JOIN kpi_page_hierarchy h
         ON h.kpi_page_id = p.id
       LEFT JOIN hierarchy_scope scope
         ON scope.page_id = p.id
       WHERE e.reporting_period_id = ?2
         AND (
           h.kpi_page_id IS NULL
           OR scope.page_id IS NULL
         )
       ORDER BY p.name, kd.name`
    )
    .all(organizationPageId, reportingPeriodId) as DashboardAmbiguousScopeRecord[];
}
