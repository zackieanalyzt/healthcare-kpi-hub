import type { Database } from "bun:sqlite";
import type { WorklistItem } from "@healthcare-kpi-hub/shared-types";
import { AppError } from "../../domain/shared/errors";
import {
  countWorklistRows,
  findCurrentPeriodKey,
  listWorklistRows,
  type WorklistQueryOptions
} from "./repository";

export interface WorklistResult {
  items: WorklistItem[];
  periodKey: string;
  totalItems: number;
}

export function getWorklist(
  db: Database,
  options: Omit<WorklistQueryOptions, "periodKey"> & { periodKey?: string }
): WorklistResult {
  const periodKey = options.periodKey ?? findCurrentPeriodKey(db);

  if (!periodKey) {
    throw new AppError(
      "NOT_FOUND_REPORTING_PERIOD",
      "No open reporting period is available.",
      404
    );
  }

  const queryOptions: WorklistQueryOptions = {
    ...options,
    periodKey
  };

  const rows = listWorklistRows(db, queryOptions);
  const totalItems = countWorklistRows(db, queryOptions);

  return {
    items: rows.map((row) => ({
      entry_id: row.entry_id,
      kpi_definition_id: row.kpi_definition_id,
      kpi_code: row.kpi_code,
      kpi_name: row.kpi_name,
      page_id: row.page_id,
      page_name: row.page_name,
      workgroup_name: row.workgroup_name,
      section_name: row.section_name,
      reporting_period_key: row.reporting_period_key,
      status: row.status,
      assigned_to: row.assigned_to,
      due_at: row.due_at,
      updated_at: row.updated_at,
      editable:
        row.role_can_update === 1 &&
        row.period_status === "open" &&
        row.status !== "locked"
    })),
    periodKey,
    totalItems
  };
}
