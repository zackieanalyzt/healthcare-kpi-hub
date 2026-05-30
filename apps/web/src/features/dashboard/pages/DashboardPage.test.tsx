import {
  DASHBOARD_LINEAGE_FIELD_NAMES,
  DASHBOARD_REPORTING_PERIOD_STATUSES,
  DASHBOARD_RELEASE,
  DASHBOARD_SCOPES,
  DASHBOARD_SUMMARY_CARD_CODES,
  DASHBOARD_SUMMARY_CARD_LABELS,
  DASHBOARD_WARNING_CODE,
  DASHBOARD_WARNING_MESSAGES
} from "@healthcare-kpi-hub/config";
import type { DashboardOrganizationSummary } from "@healthcare-kpi-hub/shared-types";
import { describe, expect, test } from "bun:test";
import { DashboardPage, DashboardView } from "./DashboardPage";

function sampleSummary(overrides?: Partial<DashboardOrganizationSummary>): DashboardOrganizationSummary {
  return {
    meta: {
      contract_version: DASHBOARD_RELEASE.version,
      release_label: DASHBOARD_RELEASE.releaseLabel,
      phase_label: DASHBOARD_RELEASE.phaseLabel,
      generated_at: "2026-05-30T00:00:00.000Z"
    },
    scope: {
      type: DASHBOARD_SCOPES.ORGANIZATION,
      id: "pag_org_hospital",
      name: "Hospital Organization"
    },
    period: {
      id: "rpt_2026_05",
      key: "2026-05",
      status: DASHBOARD_REPORTING_PERIOD_STATUSES.OPEN
    },
    summary_cards: [
      { code: DASHBOARD_SUMMARY_CARD_CODES.total, label: DASHBOARD_SUMMARY_CARD_LABELS.total, value: 6 },
      { code: DASHBOARD_SUMMARY_CARD_CODES.completed, label: DASHBOARD_SUMMARY_CARD_LABELS.completed, value: 2 },
      { code: DASHBOARD_SUMMARY_CARD_CODES.pending, label: DASHBOARD_SUMMARY_CARD_LABELS.pending, value: 3 },
      { code: DASHBOARD_SUMMARY_CARD_CODES.overdue, label: DASHBOARD_SUMMARY_CARD_LABELS.overdue, value: 1 },
      { code: DASHBOARD_SUMMARY_CARD_CODES.atRisk, label: DASHBOARD_SUMMARY_CARD_LABELS.atRisk, value: 1 },
      { code: DASHBOARD_SUMMARY_CARD_CODES.achievementPercent, label: DASHBOARD_SUMMARY_CARD_LABELS.achievementPercent, value: 33.33 }
    ],
    achievement: {
      numerator: 2,
      denominator: 6,
      percent: 33.33
    },
    warnings: [
      {
        code: DASHBOARD_WARNING_CODE.MISSING_THRESHOLD_RULES,
        message: DASHBOARD_WARNING_MESSAGES[DASHBOARD_WARNING_CODE.MISSING_THRESHOLD_RULES],
        kpi_definition_id: "kpd_org_bed_occupancy",
        kpi_entry_id: "ent_org_bed_occupancy_2026_05"
      }
    ],
    lineage: [
      {
        kpi_definition_id: "kpd_org_bed_occupancy",
        assignment_id: "ent_org_bed_occupancy_2026_05",
        scope_type: DASHBOARD_SCOPES.ORGANIZATION,
        scope_id: "pag_org_hospital",
        measurement_metadata_version_or_updated_at: "2026-05-30T00:00:00.000Z",
        calculation_timestamp: "2026-05-30T00:00:00.000Z",
        source_entry_updated_at: "2026-05-30T00:00:00.000Z"
      }
    ],
    ...overrides
  };
}

function collectText(node: unknown): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join(" ");
  }

  if (typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: unknown } }).props;
    return collectText(props?.children);
  }

  return "";
}

describe("DashboardPage", () => {
  test("is defined", () => {
    expect(DashboardPage).toBeDefined();
  });
});

describe("DashboardView", () => {
  test("renders loading state", () => {
    const text = collectText(DashboardView({ state: { status: "loading" } }));

    expect(text).toContain("Organization Dashboard");
    expect(text).toContain("Loading organization dashboard");
  });

  test("renders organization dashboard summary cards", () => {
    const text = collectText(DashboardView({ state: { status: "ready", summary: sampleSummary() } }));

    expect(text).toContain(DASHBOARD_SUMMARY_CARD_LABELS.total);
    expect(text).toContain(DASHBOARD_SUMMARY_CARD_LABELS.completed);
    expect(text).toContain(DASHBOARD_SUMMARY_CARD_LABELS.pending);
    expect(text).toContain(DASHBOARD_SUMMARY_CARD_LABELS.overdue);
    expect(text).toContain(DASHBOARD_SUMMARY_CARD_LABELS.atRisk);
    expect(text).toContain(DASHBOARD_SUMMARY_CARD_LABELS.achievementPercent);
  });

  test("renders empty state", () => {
    const summary = sampleSummary({
      summary_cards: sampleSummary().summary_cards.map((card) => ({ ...card, value: 0 })),
      achievement: {
        numerator: 0,
        denominator: 0,
        percent: 0
      },
      warnings: [],
      lineage: []
    });

    const text = collectText(DashboardView({ state: { status: "ready", summary } }));

    expect(text).toContain("No operational KPI is included");
  });

  test("renders error state", () => {
    const text = collectText(DashboardView({ state: { status: "error", message: "API unavailable" } }));

    expect(text).toContain("Dashboard error");
    expect(text).toContain("API unavailable");
  });

  test("renders warnings", () => {
    const text = collectText(DashboardView({ state: { status: "ready", summary: sampleSummary() } }));

    expect(text).toContain(DASHBOARD_WARNING_CODE.MISSING_THRESHOLD_RULES);
    expect(text).toContain(DASHBOARD_WARNING_MESSAGES[DASHBOARD_WARNING_CODE.MISSING_THRESHOLD_RULES]);
  });

  test("renders meta and lineage information", () => {
    const text = collectText(DashboardView({ state: { status: "ready", summary: sampleSummary() } }));

    expect(text).toContain(DASHBOARD_RELEASE.version);
    expect(text).toContain(DASHBOARD_RELEASE.phaseLabel);
    expect(text).toContain("Lineage Summary");
    expect(text).toContain(DASHBOARD_LINEAGE_FIELD_NAMES[0]);
    expect(text).toContain("ent_org_bed_occupancy_2026_05");
  });

  test("does not render drill-down controls or chart placeholders", () => {
    const text = collectText(DashboardView({ state: { status: "ready", summary: sampleSummary() } }));

    expect(text).not.toContain("Open department");
    expect(text).not.toContain("Open workgroup");
    expect(text).not.toContain("Open unit");
    expect(text).not.toContain("Open entry");
    expect(text).not.toContain("Chart");
  });
});
