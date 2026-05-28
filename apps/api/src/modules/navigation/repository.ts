import type { Database } from "bun:sqlite";
import type { NavigationWorkgroup } from "@healthcare-kpi-hub/shared-types";

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
