import {
  DASHBOARD_ACHIEVEMENT_STATUS,
  DASHBOARD_AGGREGATION_METHOD,
  DASHBOARD_LINEAGE_FIELD_NAMES,
  DASHBOARD_MEASUREMENT_TYPE,
  DASHBOARD_RISK_STATUS,
  DASHBOARD_RELEASE,
  DASHBOARD_SCOPES,
  DASHBOARD_STATUS_RULES,
  DASHBOARD_SUMMARY_CARD_CODES,
  DASHBOARD_SUMMARY_CARD_LABELS,
  DASHBOARD_TARGET_DIRECTION,
  DASHBOARD_TARGET_OPERATOR,
  DASHBOARD_WARNING_CODE,
  DASHBOARD_WARNING_CODES
} from "@healthcare-kpi-hub/config";
import { describe, expect, test } from "bun:test";
import { createTestEnvironment } from "../../test/test-app";
import { getOrganizationDashboardSummary } from "./service";

function isoOffsetFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function setCurrentPeriodStatuses(db: ReturnType<typeof createTestEnvironment>["db"], status: string) {
  db.query("UPDATE kpi_entries SET status = ?1 WHERE reporting_period_id = 'rpt_2026_05'").run(status);
}

function setEntryState(
  db: ReturnType<typeof createTestEnvironment>["db"],
  entryId: string,
  status: string,
  dueAt: string
) {
  db.query(
    `UPDATE kpi_entries
     SET status = ?2,
         due_at = ?3,
         updated_at = ?4
     WHERE id = ?1`
  ).run(entryId, status, dueAt, new Date().toISOString());
}

function setDefinitionMetadata(
  db: ReturnType<typeof createTestEnvironment>["db"],
  definitionId: string,
  metadata: {
    measurementType?: string | null;
    measurementUnit?: string | null;
    targetOperator?: string | null;
    targetValue?: string | null;
    targetDirection?: string | null;
    targetAnnotation?: string | null;
    aggregationMethod?: string | null;
    thresholdRules?: string | null;
    milestoneLevels?: string | null;
  }
) {
  db.query(
    `UPDATE kpi_definitions
     SET measurement_type = ?2,
         measurement_unit = ?3,
         target_operator = ?4,
         target_value = ?5,
         target_direction = ?6,
         target_annotation = ?7,
         aggregation_method = ?8,
         threshold_rules = ?9,
         milestone_levels = ?10,
         updated_at = ?11
     WHERE id = ?1`
  ).run(
    definitionId,
    metadata.measurementType ?? null,
    metadata.measurementUnit ?? null,
    metadata.targetOperator ?? null,
    metadata.targetValue ?? null,
    metadata.targetDirection ?? null,
    metadata.targetAnnotation ?? null,
    metadata.aggregationMethod ?? null,
    metadata.thresholdRules ?? null,
    metadata.milestoneLevels ?? null,
    new Date().toISOString()
  );
}

function summaryCardValue(
  summary: ReturnType<typeof getOrganizationDashboardSummary>,
  code: string
): number | undefined {
  return summary.summary_cards.find((card) => card.code === code)?.value;
}

describe("dashboard organization summary service", () => {
  test("builds an organization summary with achieved, at-risk, and unconfigured KPI handling", () => {
    const { db } = createTestEnvironment();
    setCurrentPeriodStatuses(db, DASHBOARD_STATUS_RULES.workflowStatusMap.draft);

    setEntryState(db, "ent_org_bed_occupancy_2026_05", DASHBOARD_STATUS_RULES.workflowStatusMap.submitted, isoOffsetFromNow(5));
    setEntryState(db, "ent_dept_interop_2026_05", "pending", isoOffsetFromNow(5));
    setEntryState(db, "ent_unit_bi_latency_2026_05", "pending", isoOffsetFromNow(5));

    setDefinitionMetadata(db, "kpd_org_bed_occupancy", {
      measurementType: DASHBOARD_MEASUREMENT_TYPE.PERCENTAGE,
      measurementUnit: "%",
      targetOperator: DASHBOARD_TARGET_OPERATOR.GTE,
      targetValue: "80",
      targetDirection: DASHBOARD_TARGET_DIRECTION.HIGHER_IS_BETTER,
      targetAnnotation: "Maintain occupancy at or above 80 percent.",
      aggregationMethod: DASHBOARD_AGGREGATION_METHOD.LATEST_VALUE,
      thresholdRules: JSON.stringify({
        bands: [
          { status: DASHBOARD_RISK_STATUS.ON_TRACK, operator: DASHBOARD_TARGET_OPERATOR.GTE, value: 85 },
          { status: DASHBOARD_RISK_STATUS.WATCH, operator: DASHBOARD_TARGET_OPERATOR.GTE, value: 80 },
          { status: DASHBOARD_RISK_STATUS.AT_RISK, operator: DASHBOARD_TARGET_OPERATOR.GTE, value: 70 },
          { status: DASHBOARD_RISK_STATUS.CRITICAL, operator: DASHBOARD_TARGET_OPERATOR.LT, value: 70 }
        ]
      })
    });

    setDefinitionMetadata(db, "kpd_dept_interop", {
      measurementType: DASHBOARD_MEASUREMENT_TYPE.PERCENTAGE,
      measurementUnit: "%",
      targetOperator: DASHBOARD_TARGET_OPERATOR.GTE,
      targetValue: "95",
      targetDirection: DASHBOARD_TARGET_DIRECTION.HIGHER_IS_BETTER,
      targetAnnotation: "Maintain interoperability feed coverage at 95 percent.",
      aggregationMethod: DASHBOARD_AGGREGATION_METHOD.LATEST_VALUE,
      thresholdRules: JSON.stringify({
        bands: [
          { status: DASHBOARD_RISK_STATUS.ON_TRACK, operator: DASHBOARD_TARGET_OPERATOR.GTE, value: 95 },
          { status: DASHBOARD_RISK_STATUS.WATCH, operator: DASHBOARD_TARGET_OPERATOR.GTE, value: 90 },
          { status: DASHBOARD_RISK_STATUS.AT_RISK, operator: DASHBOARD_TARGET_OPERATOR.GTE, value: 80 },
          { status: DASHBOARD_RISK_STATUS.CRITICAL, operator: DASHBOARD_TARGET_OPERATOR.LT, value: 80 }
        ]
      })
    });

    const summary = getOrganizationDashboardSummary(db);

    expect(summary.meta.contract_version).toBe(DASHBOARD_RELEASE.version);
    expect(summary.meta.release_label).toBe(DASHBOARD_RELEASE.releaseLabel);
    expect(summary.meta.phase_label).toBe(DASHBOARD_RELEASE.phaseLabel);
    expect(new Date(summary.meta.generated_at).toString()).not.toBe("Invalid Date");
    expect(summary.scope.type).toBe(DASHBOARD_SCOPES.ORGANIZATION);
    expect(summary.period.key).toBe("2026-05");
    expect(summary.summary_cards).toHaveLength(6);
    expect(summary.summary_cards.find((card) => card.label === DASHBOARD_SUMMARY_CARD_LABELS.total)?.value).toBe(3);
    expect(summary.summary_cards.find((card) => card.label === DASHBOARD_SUMMARY_CARD_LABELS.pending)?.value).toBe(3);
    expect(summary.summary_cards.find((card) => card.label === DASHBOARD_SUMMARY_CARD_LABELS.completed)?.value).toBe(0);
    expect(summary.summary_cards.find((card) => card.label === DASHBOARD_SUMMARY_CARD_LABELS.atRisk)?.value).toBe(1);
    expect(summary.achievement.numerator).toBe(1);
    expect(summary.achievement.denominator).toBe(3);
    expect(summary.achievement.percent).toBeCloseTo(33.33, 2);
    expect(summary.warnings.some((warning) => warning.code === DASHBOARD_WARNING_CODES[0])).toBeTrue();
    expect(summary.warnings.some((warning) => warning.code === DASHBOARD_WARNING_CODE.MISSING_THRESHOLD_RULES)).toBeTrue();
    expect(summary.lineage).toHaveLength(3);
  });

  test("treats missing threshold rules as not configured and does not infer risk", () => {
    const { db } = createTestEnvironment();
    setCurrentPeriodStatuses(db, DASHBOARD_STATUS_RULES.workflowStatusMap.draft);

    setEntryState(db, "ent_org_bed_occupancy_2026_05", DASHBOARD_STATUS_RULES.workflowStatusMap.submitted, isoOffsetFromNow(5));

    setDefinitionMetadata(db, "kpd_org_bed_occupancy", {
      measurementType: DASHBOARD_MEASUREMENT_TYPE.PERCENTAGE,
      measurementUnit: "%",
      targetOperator: DASHBOARD_TARGET_OPERATOR.GTE,
      targetValue: "80",
      targetDirection: DASHBOARD_TARGET_DIRECTION.HIGHER_IS_BETTER,
      targetAnnotation: "Maintain occupancy at or above 80 percent.",
      aggregationMethod: DASHBOARD_AGGREGATION_METHOD.LATEST_VALUE,
      thresholdRules: null
    });

    const summary = getOrganizationDashboardSummary(db);

    expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.atRisk)).toBe(0);
    expect(summary.warnings.some((warning) => warning.code === DASHBOARD_WARNING_CODE.MISSING_THRESHOLD_RULES)).toBeTrue();
  });

  test("derives overdue from due date and excludes ambiguous scope entries from totals", () => {
    const { db } = createTestEnvironment();
    setCurrentPeriodStatuses(db, DASHBOARD_STATUS_RULES.workflowStatusMap.draft);

    setEntryState(db, "ent_org_bed_occupancy_2026_05", DASHBOARD_STATUS_RULES.workflowStatusMap.submitted, isoOffsetFromNow(-2));
    setDefinitionMetadata(db, "kpd_org_bed_occupancy", {
      measurementType: DASHBOARD_MEASUREMENT_TYPE.PERCENTAGE,
      measurementUnit: "%",
      targetOperator: DASHBOARD_TARGET_OPERATOR.GTE,
      targetValue: "80",
      targetDirection: DASHBOARD_TARGET_DIRECTION.HIGHER_IS_BETTER,
      targetAnnotation: "Maintain occupancy at or above 80 percent.",
      aggregationMethod: DASHBOARD_AGGREGATION_METHOD.LATEST_VALUE,
      thresholdRules: JSON.stringify({
        bands: [{ status: DASHBOARD_RISK_STATUS.WATCH, operator: DASHBOARD_TARGET_OPERATOR.GTE, value: 80 }]
      })
    });

    db.query(
      `INSERT INTO kpi_pages (id, section_id, code, name, description, sort_order, is_active)
       VALUES ('pag_ambiguous_scope', 'sec_digital_health', 'AMBIG', 'Ambiguous KPI Page', 'Unmapped hierarchy page', 99, 1)`
    ).run();
    db.query(
      `INSERT INTO kpi_definitions (
         id, kpi_page_id, code, name, unit, value_type, preset_code, owner_label, sort_order, is_active,
         created_at, updated_at, measurement_type, measurement_unit, target_operator, target_value, target_direction,
         target_annotation, aggregation_method, threshold_rules
       ) VALUES (
         'kpd_ambiguous_scope', 'pag_ambiguous_scope', 'KPI-AMB-001', 'Ambiguous Scope KPI', '%', 'percentage', 'percentage',
         'Unknown Owner', 99, 1, ?1, ?1, ?2, '%', '>=', '50', 'higher_is_better',
         'Ambiguous scope KPI.', 'latest_value', ?3
       )`
    ).run(
      new Date().toISOString(),
      DASHBOARD_MEASUREMENT_TYPE.PERCENTAGE,
      JSON.stringify({ bands: [{ status: DASHBOARD_RISK_STATUS.ON_TRACK, operator: DASHBOARD_TARGET_OPERATOR.GTE, value: 50 }] })
    );
    db.query(
      `INSERT INTO kpi_entries (
         id, kpi_definition_id, reporting_period_id, status, assigned_to_user_id, due_at, updated_at, updated_by_user_id, created_at
       ) VALUES (
         'ent_ambiguous_scope_2026_05', 'kpd_ambiguous_scope', 'rpt_2026_05', 'pending', 'usr_editor', ?1, ?2, 'usr_editor', ?2
       )`
    ).run(isoOffsetFromNow(5), new Date().toISOString());

    const summary = getOrganizationDashboardSummary(db);

    expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.total)).toBe(1);
    expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.overdue)).toBe(1);
    expect(summary.warnings.some((warning) => warning.code === DASHBOARD_WARNING_CODE.AMBIGUOUS_SCOPE)).toBeTrue();
  });

  test("supports milestone and boolean metadata validation warnings", () => {
    const { db } = createTestEnvironment();
    setCurrentPeriodStatuses(db, DASHBOARD_STATUS_RULES.workflowStatusMap.draft);

    setEntryState(db, "ent_org_bed_occupancy_2026_05", DASHBOARD_STATUS_RULES.workflowStatusMap.submitted, isoOffsetFromNow(5));
    setEntryState(db, "ent_dept_interop_2026_05", DASHBOARD_STATUS_RULES.workflowStatusMap.submitted, isoOffsetFromNow(5));

    setDefinitionMetadata(db, "kpd_org_bed_occupancy", {
      measurementType: DASHBOARD_MEASUREMENT_TYPE.MILESTONE,
      measurementUnit: "level",
      targetOperator: DASHBOARD_TARGET_OPERATOR.MILESTONE_AT_LEAST,
      targetValue: "3",
      targetDirection: DASHBOARD_TARGET_DIRECTION.MILESTONE_PROGRESSION,
      targetAnnotation: "Reach milestone level 3.",
      aggregationMethod: DASHBOARD_AGGREGATION_METHOD.LATEST_LEVEL,
      milestoneLevels: null
    });

    setDefinitionMetadata(db, "kpd_dept_interop", {
      measurementType: DASHBOARD_MEASUREMENT_TYPE.BOOLEAN,
      measurementUnit: "flag",
      targetOperator: DASHBOARD_TARGET_OPERATOR.EQ,
      targetValue: "true",
      targetDirection: DASHBOARD_TARGET_DIRECTION.BOOLEAN_TRUE,
      targetAnnotation: "Boolean KPI should be true.",
      aggregationMethod: DASHBOARD_AGGREGATION_METHOD.PASS_RATE
    });

    db.query(
      `UPDATE entry_values
       SET actual_value = 'true'
       WHERE kpi_entry_id = 'ent_dept_interop_2026_05'`
    ).run();

    const summary = getOrganizationDashboardSummary(db);

    expect(summary.warnings.some((warning) => warning.code === DASHBOARD_WARNING_CODE.MISSING_MILESTONE_LEVELS)).toBeTrue();
    expect(summary.achievement.numerator).toBe(1);
  });

  test("uses accepted denominator inclusion and exclusion rules", () => {
    const { db } = createTestEnvironment();

    for (const status of DASHBOARD_STATUS_RULES.denominatorIncluded) {
      setCurrentPeriodStatuses(db, DASHBOARD_STATUS_RULES.workflowStatusMap.draft);
      setEntryState(db, "ent_org_bed_occupancy_2026_05", status, isoOffsetFromNow(5));

      const summary = getOrganizationDashboardSummary(db);

      expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.total)).toBe(1);
      expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.overdue)).toBe(
        status === DASHBOARD_STATUS_RULES.workflowStatusMap.overdue ? 1 : 0
      );
    }

    for (const status of DASHBOARD_STATUS_RULES.denominatorExcluded) {
      setCurrentPeriodStatuses(db, DASHBOARD_STATUS_RULES.workflowStatusMap.draft);
      setEntryState(db, "ent_org_bed_occupancy_2026_05", status, isoOffsetFromNow(5));

      const summary = getOrganizationDashboardSummary(db);

      expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.total)).toBe(0);
    }
  });

  test("emits minimum warning and lineage fields without crashing on incomplete metadata", () => {
    const { db } = createTestEnvironment();
    setCurrentPeriodStatuses(db, DASHBOARD_STATUS_RULES.workflowStatusMap.draft);
    setEntryState(db, "ent_org_bed_occupancy_2026_05", DASHBOARD_STATUS_RULES.workflowStatusMap.submitted, isoOffsetFromNow(5));

    setDefinitionMetadata(db, "kpd_org_bed_occupancy", {
      measurementType: DASHBOARD_MEASUREMENT_TYPE.COUNT,
      targetOperator: null,
      targetValue: null,
      targetDirection: null,
      aggregationMethod: DASHBOARD_AGGREGATION_METHOD.PASS_RATE,
      thresholdRules: null
    });

    const summary = getOrganizationDashboardSummary(db);
    const warningCodes = new Set(summary.warnings.map((warning) => warning.code));

    expect(warningCodes.has(DASHBOARD_WARNING_CODE.MISSING_TARGET_RULE)).toBeTrue();
    expect(warningCodes.has(DASHBOARD_WARNING_CODE.MISSING_THRESHOLD_RULES)).toBeTrue();
    expect(warningCodes.has(DASHBOARD_WARNING_CODE.INVALID_AGGREGATION_METHOD)).toBeTrue();
    expect(summary.achievement.numerator).toBe(0);
    expect(summary.lineage).toHaveLength(1);

    for (const fieldName of DASHBOARD_LINEAGE_FIELD_NAMES) {
      expect(Object.hasOwn(summary.lineage[0]!, fieldName)).toBeTrue();
    }
  });

  test("returns stable empty-state shape when no operational KPI is included", () => {
    const { db } = createTestEnvironment();
    setCurrentPeriodStatuses(db, DASHBOARD_STATUS_RULES.workflowStatusMap.draft);

    const summary = getOrganizationDashboardSummary(db);

    expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.total)).toBe(0);
    expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.completed)).toBe(0);
    expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.pending)).toBe(0);
    expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.overdue)).toBe(0);
    expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.atRisk)).toBe(0);
    expect(summaryCardValue(summary, DASHBOARD_SUMMARY_CARD_CODES.achievementPercent)).toBe(0);
    expect(summary.achievement).toEqual({
      numerator: 0,
      denominator: 0,
      percent: 0
    });
    expect(summary.warnings).toEqual([]);
    expect(summary.lineage).toEqual([]);
  });

  test("keeps dashboard enum baselines centralized in config", () => {
    expect(DASHBOARD_WARNING_CODES).toContain(DASHBOARD_WARNING_CODE.MISSING_MEASUREMENT_TYPE);
    expect(Object.values(DASHBOARD_ACHIEVEMENT_STATUS)).toContain(DASHBOARD_ACHIEVEMENT_STATUS.ACHIEVED);
    expect(Object.values(DASHBOARD_RISK_STATUS)).toContain(DASHBOARD_RISK_STATUS.NOT_CONFIGURED);
  });
});
