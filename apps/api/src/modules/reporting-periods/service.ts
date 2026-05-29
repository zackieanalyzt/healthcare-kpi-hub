import type { Database } from "bun:sqlite";
import type { ReportingPeriodSummary } from "@healthcare-kpi-hub/shared-types";
import { findReportingPeriodSummary } from "./repository";

export function getReportingPeriodSummary(
  db: Database,
  periodId: string
): ReportingPeriodSummary | null {
  return findReportingPeriodSummary(db, periodId);
}
