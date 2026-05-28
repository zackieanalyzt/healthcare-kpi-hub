import type { Database } from "bun:sqlite";
import type { NavigationWorkgroup } from "@healthcare-kpi-hub/shared-types";
import { listActiveNavigationRows, mapNavigationTree } from "./repository";

export function getNavigationTree(db: Database): NavigationWorkgroup[] {
  return mapNavigationTree(listActiveNavigationRows(db));
}
