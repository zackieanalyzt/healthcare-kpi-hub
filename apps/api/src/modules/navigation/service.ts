import type { Database } from "bun:sqlite";
import type {
  KpiPageDetail,
  KpiPageHierarchyNode,
  KpiPageSummary,
  NavigationWorkgroup
} from "@healthcare-kpi-hub/shared-types";
import { AppError } from "../../domain/shared/errors";
import {
  findCurrentPeriod,
  findHierarchyCurrentNode,
  findHierarchyParentNode,
  findKpiPageMetadata,
  listActiveNavigationRows,
  listAssignedKpisForPage,
  listHierarchyChildNodes,
  mapNavigationTree
} from "./repository";

export function getNavigationTree(db: Database): NavigationWorkgroup[] {
  return mapNavigationTree(listActiveNavigationRows(db));
}

export function getKpiPageDetail(
  db: Database,
  pageId: string,
  currentUsername: string | null
): KpiPageDetail {
  const page = findKpiPageMetadata(db, pageId);
  if (!page) {
    throw new AppError("NOT_FOUND_KPI_PAGE", "KPI page not found.", 404);
  }

  const currentNode = findHierarchyCurrentNode(db, pageId);
  if (!currentNode) {
    throw new AppError(
      "NOT_FOUND_KPI_PAGE_HIERARCHY",
      "KPI page hierarchy metadata is missing.",
      404
    );
  }

  const currentPeriod = findCurrentPeriod(db);

  return {
    page,
    hierarchy: {
      current_node: currentNode,
      parent_node: findHierarchyParentNode(db, pageId),
      child_nodes: listHierarchyChildNodes(db, pageId)
    },
    current_period: currentPeriod,
    assigned_kpis: listAssignedKpisForPage(
      db,
      pageId,
      currentPeriod?.id ?? null,
      currentUsername
    )
  };
}

export function getKpiPageContext(
  db: Database,
  pageId: string
): {
  page: KpiPageSummary;
  hierarchy: {
    current_node: KpiPageHierarchyNode;
    parent_node: KpiPageHierarchyNode | null;
    child_nodes: KpiPageHierarchyNode[];
  };
} | null {
  const page = findKpiPageMetadata(db, pageId);
  const currentNode = findHierarchyCurrentNode(db, pageId);

  if (!page || !currentNode) {
    return null;
  }

  return {
    page,
    hierarchy: {
      current_node: currentNode,
      parent_node: findHierarchyParentNode(db, pageId),
      child_nodes: listHierarchyChildNodes(db, pageId)
    }
  };
}
