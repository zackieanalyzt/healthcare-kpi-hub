import type { Database } from "bun:sqlite";
import type {
  HierarchyLevelCode,
  KpiPageAssignedKpiItem,
  KpiPageCurrentPeriod,
  KpiPageHierarchyNode,
  KpiPageSummary,
  NavigationWorkgroup
} from "@healthcare-kpi-hub/shared-types";
import { PERMISSIONS } from "@healthcare-kpi-hub/config";

interface NavigationRow {
  workgroup_id: string;
  workgroup_code: string;
  workgroup_name: string;
  section_id: string | null;
  section_code: string | null;
  section_name: string | null;
  page_id: string | null;
  page_code: string | null;
  page_name: string | null;
}

interface KpiPageMetadataRow {
  page_id: string;
  page_code: string;
  page_name: string;
  page_description: string | null;
  section_id: string;
  section_code: string;
  section_name: string;
  workgroup_id: string;
  workgroup_code: string;
  workgroup_name: string;
}

interface HierarchyNodeRow {
  page_id: string;
  code: string;
  name: string;
  hierarchy_level: HierarchyLevelCode;
  owner_label: string | null;
  owner_user_id: string | null;
  owner_username: string | null;
  owner_full_name: string | null;
}

interface AssignedKpiRow {
  definition_id: string;
  definition_code: string;
  definition_name: string;
  definition_unit: string | null;
  value_type: string;
  preset_code: string;
  definition_owner_label: string | null;
  entry_id: string | null;
  entry_status: string | null;
  assigned_to: string | null;
  due_at: string | null;
  entry_updated_at: string | null;
  updated_by: string | null;
  target_value: string | null;
  actual_value: string | null;
  progress_value: number | null;
  note: string | null;
  extra_json: string | null;
  role_can_update: number;
  current_period_status: string | null;
}

export function listActiveNavigationRows(db: Database): NavigationRow[] {
  return db
    .query(
      `SELECT
         w.id AS workgroup_id,
         w.code AS workgroup_code,
         w.name AS workgroup_name,
         s.id AS section_id,
         s.code AS section_code,
         s.name AS section_name,
         p.id AS page_id,
         p.code AS page_code,
         p.name AS page_name
       FROM workgroups w
       LEFT JOIN sections s
         ON s.workgroup_id = w.id
        AND s.is_active = 1
       LEFT JOIN kpi_pages p
         ON p.section_id = s.id
        AND p.is_active = 1
       WHERE w.is_active = 1
       ORDER BY w.sort_order, s.sort_order, p.sort_order`
    )
    .all() as NavigationRow[];
}

export function mapNavigationTree(rows: NavigationRow[]): NavigationWorkgroup[] {
  const workgroups = new Map<string, NavigationWorkgroup>();

  for (const row of rows) {
    if (!workgroups.has(row.workgroup_id)) {
      workgroups.set(row.workgroup_id, {
        id: row.workgroup_id,
        code: row.workgroup_code,
        name: row.workgroup_name,
        sections: []
      });
    }

    if (!row.section_id) {
      continue;
    }

    const workgroup = workgroups.get(row.workgroup_id)!;
    let section = workgroup.sections.find((candidate) => candidate.id === row.section_id);

    if (!section) {
      section = {
        id: row.section_id,
        code: row.section_code ?? "",
        name: row.section_name ?? "",
        pages: []
      };
      workgroup.sections.push(section);
    }

    if (!row.page_id) {
      continue;
    }

    section.pages.push({
      id: row.page_id,
      code: row.page_code ?? "",
      name: row.page_name ?? "",
      is_active: true
    });
  }

  return Array.from(workgroups.values());
}

export function findKpiPageMetadata(
  db: Database,
  pageId: string
): KpiPageSummary | null {
  const row = db
    .query(
      `SELECT
         p.id AS page_id,
         p.code AS page_code,
         p.name AS page_name,
         p.description AS page_description,
         s.id AS section_id,
         s.code AS section_code,
         s.name AS section_name,
         w.id AS workgroup_id,
         w.code AS workgroup_code,
         w.name AS workgroup_name
       FROM kpi_pages p
       INNER JOIN sections s
         ON s.id = p.section_id
        AND s.is_active = 1
       INNER JOIN workgroups w
         ON w.id = s.workgroup_id
        AND w.is_active = 1
       WHERE p.id = ?1
         AND p.is_active = 1`
    )
    .get(pageId) as KpiPageMetadataRow | null;

  if (!row) {
    return null;
  }

  return {
    id: row.page_id,
    code: row.page_code,
    name: row.page_name,
    description: row.page_description,
    section: {
      id: row.section_id,
      code: row.section_code,
      name: row.section_name
    },
    workgroup: {
      id: row.workgroup_id,
      code: row.workgroup_code,
      name: row.workgroup_name
    }
  };
}

function mapHierarchyNodeRow(row: HierarchyNodeRow | null): KpiPageHierarchyNode | null {
  if (!row) {
    return null;
  }

  return {
    page_id: row.page_id,
    code: row.code,
    name: row.name,
    hierarchy_level: row.hierarchy_level,
    owner_label: row.owner_label,
    owner_user: row.owner_user_id
      ? {
          id: row.owner_user_id,
          username: row.owner_username ?? "",
          full_name: row.owner_full_name
        }
      : null
  };
}

export function findCurrentPeriod(db: Database): KpiPageCurrentPeriod | null {
  return (
    (db
      .query(
        `SELECT id, period_key, status, starts_at, ends_at
         FROM reporting_periods
         WHERE status = 'open'
         ORDER BY starts_at DESC
         LIMIT 1`
      )
      .get() as KpiPageCurrentPeriod | null) ?? null
  );
}

export function findHierarchyCurrentNode(
  db: Database,
  pageId: string
): KpiPageHierarchyNode | null {
  const row = db
    .query(
      `SELECT
         p.id AS page_id,
         p.code AS code,
         p.name AS name,
         h.hierarchy_level AS hierarchy_level,
         h.owner_label AS owner_label,
         owner_user.id AS owner_user_id,
         owner_user.username AS owner_username,
         owner_user.full_name AS owner_full_name
       FROM kpi_page_hierarchy h
       INNER JOIN kpi_pages p ON p.id = h.kpi_page_id AND p.is_active = 1
       LEFT JOIN users owner_user ON owner_user.id = h.owner_user_id
       WHERE h.kpi_page_id = ?1`
    )
    .get(pageId) as HierarchyNodeRow | null;

  return mapHierarchyNodeRow(row);
}

export function findHierarchyParentNode(
  db: Database,
  pageId: string
): KpiPageHierarchyNode | null {
  const row = db
    .query(
      `SELECT
         parent_page.id AS page_id,
         parent_page.code AS code,
         parent_page.name AS name,
         parent_hierarchy.hierarchy_level AS hierarchy_level,
         parent_hierarchy.owner_label AS owner_label,
         owner_user.id AS owner_user_id,
         owner_user.username AS owner_username,
         owner_user.full_name AS owner_full_name
       FROM kpi_page_hierarchy current_hierarchy
       INNER JOIN kpi_page_hierarchy parent_hierarchy
         ON parent_hierarchy.kpi_page_id = current_hierarchy.parent_kpi_page_id
       INNER JOIN kpi_pages parent_page
         ON parent_page.id = parent_hierarchy.kpi_page_id
        AND parent_page.is_active = 1
       LEFT JOIN users owner_user ON owner_user.id = parent_hierarchy.owner_user_id
       WHERE current_hierarchy.kpi_page_id = ?1`
    )
    .get(pageId) as HierarchyNodeRow | null;

  return mapHierarchyNodeRow(row);
}

export function listHierarchyChildNodes(
  db: Database,
  pageId: string
): KpiPageHierarchyNode[] {
  const rows = db
    .query(
      `SELECT
         child_page.id AS page_id,
         child_page.code AS code,
         child_page.name AS name,
         child_hierarchy.hierarchy_level AS hierarchy_level,
         child_hierarchy.owner_label AS owner_label,
         owner_user.id AS owner_user_id,
         owner_user.username AS owner_username,
         owner_user.full_name AS owner_full_name
       FROM kpi_page_hierarchy child_hierarchy
       INNER JOIN kpi_pages child_page
         ON child_page.id = child_hierarchy.kpi_page_id
        AND child_page.is_active = 1
       LEFT JOIN users owner_user ON owner_user.id = child_hierarchy.owner_user_id
       WHERE child_hierarchy.parent_kpi_page_id = ?1
       ORDER BY child_hierarchy.sort_order, child_page.sort_order, child_page.name`
    )
    .all(pageId) as HierarchyNodeRow[];

  return rows.map((row) => mapHierarchyNodeRow(row)!);
}

export function listAssignedKpisForPage(
  db: Database,
  pageId: string,
  reportingPeriodId: string | null,
  currentUsername: string | null
): KpiPageAssignedKpiItem[] {
  const rows = db
    .query(
      `SELECT
         kd.id AS definition_id,
         kd.code AS definition_code,
         kd.name AS definition_name,
         kd.unit AS definition_unit,
         kd.value_type AS value_type,
         kd.preset_code AS preset_code,
         kd.owner_label AS definition_owner_label,
         e.id AS entry_id,
         e.status AS entry_status,
         assigned.username AS assigned_to,
         e.due_at AS due_at,
         e.updated_at AS entry_updated_at,
         updated_by.username AS updated_by,
         ev.target_value AS target_value,
         ev.actual_value AS actual_value,
         ev.progress_value AS progress_value,
         ev.note AS note,
         ev.extra_json AS extra_json,
         CASE
           WHEN EXISTS (
             SELECT 1
             FROM role_permissions rp2
             INNER JOIN users current_user ON current_user.role_code = rp2.role_code
             WHERE current_user.username = ?3
               AND rp2.permission_code = ?4
           ) THEN 1
           ELSE 0
         END AS role_can_update,
         rp.status AS current_period_status
       FROM kpi_definitions kd
       LEFT JOIN kpi_entries e
         ON e.kpi_definition_id = kd.id
        AND e.reporting_period_id = ?2
       LEFT JOIN reporting_periods rp
         ON rp.id = e.reporting_period_id
       LEFT JOIN users assigned
         ON assigned.id = e.assigned_to_user_id
       LEFT JOIN users updated_by
         ON updated_by.id = e.updated_by_user_id
       LEFT JOIN entry_values ev
         ON ev.kpi_entry_id = e.id
       WHERE kd.kpi_page_id = ?1
         AND kd.is_active = 1
       ORDER BY kd.sort_order, kd.code`
    )
    .all(pageId, reportingPeriodId, currentUsername, PERMISSIONS.KPI_UPDATE) as AssignedKpiRow[];

  return rows.map((row) => ({
    definition: {
      id: row.definition_id,
      code: row.definition_code,
      name: row.definition_name,
      unit: row.definition_unit,
      value_type: row.value_type,
      preset_code: row.preset_code,
      owner_label: row.definition_owner_label
    },
    assignment: {
      entry_id: row.entry_id,
      status: row.entry_status,
      assigned_to: row.assigned_to,
      due_at: row.due_at,
      updated_at: row.entry_updated_at,
      updated_by: row.updated_by,
      editable:
        row.role_can_update === 1 &&
        row.entry_status !== null &&
        row.entry_status !== "locked" &&
        row.current_period_status === "open"
    },
    value: {
      target_value: row.target_value,
      actual_value: row.actual_value,
      progress_value: row.progress_value,
      note: row.note,
      extra_json: row.extra_json
    }
  }));
}
