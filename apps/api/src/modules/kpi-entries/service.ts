import type { Database } from "bun:sqlite";
import type { KpiEntryDetail } from "@healthcare-kpi-hub/shared-types";
import { AppError } from "../../domain/shared/errors";
import { getRecentAuditHistoryForEntity } from "../audit/service";
import { getDefinitionSummary } from "../kpi-definitions/service";
import { getKpiPageContext } from "../navigation/service";
import { getReportingPeriodSummary } from "../reporting-periods/service";
import { findEntryValuePayload, findKpiEntryCoreRecord } from "./repository";

export function getKpiEntryDetail(
  db: Database,
  entryId: string,
  currentUsername: string | null
): KpiEntryDetail {
  const core = findKpiEntryCoreRecord(db, entryId, currentUsername);

  if (!core) {
    throw new AppError("NOT_FOUND_KPI_ENTRY", "KPI entry not found.", 404);
  }

  const definition = getDefinitionSummary(db, core.definition_id);
  const reportingPeriod = getReportingPeriodSummary(db, core.reporting_period_id);
  const pageContext = getKpiPageContext(db, core.page_id);

  if (!definition || !reportingPeriod || !pageContext) {
    throw new AppError(
      "NOT_FOUND_KPI_ENTRY_CONTEXT",
      "KPI entry context is missing or inactive.",
      404
    );
  }

  return {
    entry: core.entry,
    definition,
    value: findEntryValuePayload(db, entryId),
    reporting_period: reportingPeriod,
    page: pageContext.page,
    hierarchy: pageContext.hierarchy,
    history: getRecentAuditHistoryForEntity(db, "kpi_entry", entryId, 10)
  };
}
