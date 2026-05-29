import type { Database } from "bun:sqlite";
import type { ReportingPeriodSummary } from "@healthcare-kpi-hub/shared-types";

export function findReportingPeriodSummary(
  db: Database,
  periodId: string
): ReportingPeriodSummary | null {
  return (
    (db
      .query(
        `SELECT
           id,
           period_key,
           period_type,
           status,
           starts_at,
           ends_at
         FROM reporting_periods
         WHERE id = ?1`
      )
      .get(periodId) as ReportingPeriodSummary | null) ?? null
  );
}
