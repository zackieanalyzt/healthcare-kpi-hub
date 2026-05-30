import {
  DASHBOARD_ACHIEVEMENT_STATUS,
  DASHBOARD_RELEASE,
  DASHBOARD_SCOPES,
  DASHBOARD_STATUS_RULES,
  DASHBOARD_SUMMARY_CARD_CODES,
  DASHBOARD_WARNING_CODE
} from "@healthcare-kpi-hub/config";
import { describe, expect, test } from "bun:test";
import { createTestEnvironment } from "../../test/test-app";
import { getDepartmentDashboardSummary } from "./service";
import { AppError } from "../../domain/shared/errors";

function isoOffsetFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

describe("dashboard department summary service", () => {
  test("department summary returns correct counts and includes descendants", () => {
    const { db } = createTestEnvironment();

    // Set all entries to submitted/approved so they are included in denominator
    db.query("UPDATE kpi_entries SET status = 'submitted' WHERE reporting_period_id = 'rpt_2026_05'").run();

    // Call summary for pag_dept_digital_health
    const summary = getDepartmentDashboardSummary(db, { nodeId: "pag_dept_digital_health" });

    expect(summary.scope.type).toBe("department");
    expect(summary.scope.id).toBe("pag_dept_digital_health");
    expect(summary.scope.name).toBe("Digital Health Division KPI");

    // Descendants under pag_dept_digital_health are:
    // 1. kpd_dept_interop (on pag_dept_digital_health)
    // 2. kpd_unit_bi_latency (on pag_unit_bi_team)
    // 3. kpd_individual_data_quality (on pag_individual_analyst)
    // 4. kpd_empty_value_followup (on pag_unit_bi_team)
    // Total should be 4
    expect(summary.achievement.denominator).toBe(4);
  });

  test("department summary excludes sibling departments", () => {
    const { db } = createTestEnvironment();

    // Add a KPI definition and entry for pag_promotion (sibling department)
    db.query(
      `INSERT INTO kpi_definitions (id, kpi_page_id, code, name, value_type, preset_code, sort_order, is_active, created_at, updated_at)
       VALUES ('kpd_promo_kpi', 'pag_promotion', 'KPI-PROMO-999', 'Promotion KPI', 'percentage', 'percentage', 10, 1, '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z')`
    ).run();

    db.query(
      `INSERT INTO kpi_entries (id, kpi_definition_id, reporting_period_id, status, updated_at, created_at)
       VALUES ('ent_promo_kpi', 'kpd_promo_kpi', 'rpt_2026_05', 'submitted', '2026-05-20T00:00:00Z', '2026-05-20T00:00:00Z')`
    ).run();

    // Set all digital health entries to submitted
    db.query("UPDATE kpi_entries SET status = 'submitted' WHERE reporting_period_id = 'rpt_2026_05'").run();

    // Sibling promotion KPI should NOT be included in digital health department summary
    const summaryDH = getDepartmentDashboardSummary(db, { nodeId: "pag_dept_digital_health" });
    expect(summaryDH.achievement.denominator).toBe(4);

    // Call for sibling pag_promotion department summary
    const summaryPromo = getDepartmentDashboardSummary(db, { nodeId: "pag_promotion" });
    // Should contain exactly 3 KPIs (2 pre-seeded + 1 new promo one)
    expect(summaryPromo.achievement.denominator).toBe(3);
  });

  test("department summary emits AMBIGUOUS_SCOPE warning for out-of-hierarchy entries", () => {
    const { db } = createTestEnvironment();

    // Set all entries to submitted
    db.query("UPDATE kpi_entries SET status = 'submitted' WHERE reporting_period_id = 'rpt_2026_05'").run();

    // We have kpd_org_bed_occupancy on pag_org_hospital (parent)
    // If we call digital health department summary, it should emit AMBIGUOUS_SCOPE warnings for other entries not under its scope.
    const summary = getDepartmentDashboardSummary(db, { nodeId: "pag_dept_digital_health" });

    // Ambiguous scope records are ones where the entry exists in rpt_2026_05 but their page is not in the department's hierarchy scope.
    // Sibling promotion entries and organization entries should be flagged as ambiguous scope.
    expect(summary.warnings.some((w) => w.code === DASHBOARD_WARNING_CODE.AMBIGUOUS_SCOPE)).toBeTrue();
  });

  test("empty department summary returns stable zero-value shape", () => {
    const { db } = createTestEnvironment();

    // Insert an empty department under org root
    db.query(
      `INSERT INTO kpi_pages (id, section_id, code, name, sort_order, is_active)
       VALUES ('pag_empty_dept', 'sec_enterprise_kpi', 'EMPTY-DEPT', 'Empty Dept Overview', 10, 1)`
    ).run();

    db.query(
      `INSERT INTO kpi_page_hierarchy (kpi_page_id, parent_kpi_page_id, hierarchy_level)
       VALUES ('pag_empty_dept', 'pag_org_hospital', 'department')`
    ).run();

    const summary = getDepartmentDashboardSummary(db, { nodeId: "pag_empty_dept" });
    expect(summary.achievement.denominator).toBe(0);
    expect(summary.achievement.numerator).toBe(0);
    expect(summary.achievement.percent).toBe(0);
    expect(summary.summary_cards.find((c) => c.code === DASHBOARD_SUMMARY_CARD_CODES.total)?.value).toBe(0);
  });

  test("department summary validates nodeId carefully", () => {
    const { db } = createTestEnvironment();

    // 1. nodeId does not exist
    expect(() => {
      getDepartmentDashboardSummary(db, { nodeId: "non_existent_page" });
    }).toThrow(
      new AppError("VALIDATION_FAILED", "Request validation failed.", 400, [
        { field: "nodeId", issue: "not_found" }
      ])
    );

    // 2. wrong hierarchy level (e.g. organization root page)
    expect(() => {
      getDepartmentDashboardSummary(db, { nodeId: "pag_org_hospital" });
    }).toThrow(
      new AppError("VALIDATION_FAILED", "Request validation failed.", 400, [
        { field: "nodeId", issue: "wrong_hierarchy_level" }
      ])
    );

    // 3. out of scope (e.g. a department whose parent is not the organization root)
    // Let's create an org root, another child org root, etc., or just simulate wrong parent
    db.query(
      `INSERT INTO kpi_pages (id, section_id, code, name, sort_order, is_active)
       VALUES ('pag_another_org', 'sec_enterprise_kpi', 'OTHER-ORG', 'Other Org Overview', 10, 1)`
    ).run();
    db.query(
      `INSERT INTO kpi_page_hierarchy (kpi_page_id, parent_kpi_page_id, hierarchy_level, sort_order)
       VALUES ('pag_another_org', NULL, 'organization', 99)`
    ).run();
    db.query(
      `INSERT INTO kpi_pages (id, section_id, code, name, sort_order, is_active)
       VALUES ('pag_detached_dept', 'sec_enterprise_kpi', 'DETACHED-DEPT', 'Detached Dept Overview', 10, 1)`
    ).run();
    db.query(
      `INSERT INTO kpi_page_hierarchy (kpi_page_id, parent_kpi_page_id, hierarchy_level)
       VALUES ('pag_detached_dept', 'pag_another_org', 'department')`
    ).run();

    expect(() => {
      getDepartmentDashboardSummary(db, { nodeId: "pag_detached_dept" });
    }).toThrow(
      new AppError("VALIDATION_FAILED", "Request validation failed.", 400, [
        { field: "nodeId", issue: "out_of_scope" }
      ])
    );

    // 4. nodeId level matches but page is inactive
    db.query("UPDATE kpi_pages SET is_active = 0 WHERE id = 'pag_promotion'").run();
    expect(() => {
      getDepartmentDashboardSummary(db, { nodeId: "pag_promotion" });
    }).toThrow(
      new AppError("NOT_FOUND", "Department page is inactive.", 404)
    );
  });
});
