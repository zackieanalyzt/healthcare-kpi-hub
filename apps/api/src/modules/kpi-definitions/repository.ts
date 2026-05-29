import type { Database } from "bun:sqlite";
import type { KpiDefinitionSummary } from "@healthcare-kpi-hub/shared-types";

export function findActiveDefinitionSummary(
  db: Database,
  definitionId: string
): KpiDefinitionSummary | null {
  return (
    (db
      .query(
        `SELECT
           id,
           code,
           name,
           unit,
           value_type,
           preset_code,
           owner_label
         FROM kpi_definitions
         WHERE id = ?1
           AND is_active = 1`
      )
      .get(definitionId) as KpiDefinitionSummary | null) ?? null
  );
}
