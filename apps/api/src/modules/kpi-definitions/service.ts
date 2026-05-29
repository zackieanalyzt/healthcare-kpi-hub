import type { Database } from "bun:sqlite";
import type { KpiDefinitionSummary } from "@healthcare-kpi-hub/shared-types";
import { findActiveDefinitionSummary } from "./repository";

export function getDefinitionSummary(
  db: Database,
  definitionId: string
): KpiDefinitionSummary | null {
  return findActiveDefinitionSummary(db, definitionId);
}
