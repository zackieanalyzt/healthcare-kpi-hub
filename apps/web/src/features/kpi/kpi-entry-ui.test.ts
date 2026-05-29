import { describe, expect, test } from "bun:test";
import type { ApiFailure, AuditHistoryItem, KpiEntryDetail } from "@healthcare-kpi-hub/shared-types";
import {
  buildConservativeMutationPayload,
  formatAuditHistoryItem,
  getAllowedNextStatuses,
  getKpiEntryMutationErrorMessage
} from "./kpi-entry-ui";

function buildDetail(overrides?: Partial<KpiEntryDetail>): KpiEntryDetail {
  return {
    entry: {
      id: "ent_test",
      status: "pending",
      assigned_to: "editor.user",
      due_at: "2026-05-31T17:00:00Z",
      updated_at: "2026-05-29T09:00:00Z",
      updated_by: "editor.user",
      editable: true
    },
    definition: {
      id: "kpd_test",
      code: "KPI-TEST-001",
      name: "Test KPI",
      unit: "%",
      value_type: "percentage",
      preset_code: "percentage",
      owner_label: "BI Team"
    },
    value: {
      target_value: "95",
      actual_value: "90",
      progress_value: 0.9,
      note: "Original note",
      extra_json: null
    },
    reporting_period: {
      id: "rpt_01",
      period_key: "2026-05",
      period_type: "monthly",
      status: "open",
      starts_at: "2026-05-01T00:00:00Z",
      ends_at: "2026-05-31T23:59:59Z"
    },
    page: {
      id: "pag_01",
      code: "PAGE-01",
      name: "KPI Page",
      description: null,
      section: {
        id: "sec_01",
        code: "SEC-01",
        name: "Section 01"
      },
      workgroup: {
        id: "wg_01",
        code: "WG-01",
        name: "Workgroup 01"
      }
    },
    hierarchy: {
      current_node: {
        page_id: "pag_01",
        code: "PAGE-01",
        name: "KPI Page",
        hierarchy_level: "unit",
        owner_label: "BI Team",
        owner_user: null
      },
      parent_node: null,
      child_nodes: []
    },
    history: [],
    ...overrides
  };
}

function buildFailure(error: ApiFailure["error"]): ApiFailure["error"] {
  return error;
}

describe("kpi entry ui helpers", () => {
  test("builds conservative mutation payload for approved fields", () => {
    const detail = buildDetail();
    const result = buildConservativeMutationPayload(detail, {
      status: "submitted",
      actualValue: "92",
      progressValue: "0.92",
      note: "Updated after verification"
    });

    expect(result.ok).toBeTrue();
    if (!result.ok) {
      return;
    }

    expect(result.payload).toEqual({
      updated_at: "2026-05-29T09:00:00Z",
      status: "submitted",
      value: {
        actual_value: "92",
        progress_value: 0.92,
        note: "Updated after verification"
      }
    });
  });

  test("cancel-equivalent drafts with no changes are rejected before save", () => {
    const detail = buildDetail();
    const result = buildConservativeMutationPayload(detail, {
      status: "pending",
      actualValue: "90",
      progressValue: "0.9",
      note: "Original note"
    });

    expect(result.ok).toBeFalse();
    if (result.ok) {
      return;
    }

    expect(result.message).toContain("Make a change before saving");
  });

  test("invalid progress draft is rejected before network save", () => {
    const detail = buildDetail();
    const result = buildConservativeMutationPayload(detail, {
      status: "pending",
      actualValue: "90",
      progressValue: "1.5",
      note: "Original note"
    });

    expect(result.ok).toBeFalse();
    if (result.ok) {
      return;
    }

    expect(result.message).toContain("Progress must be a number between 0 and 1");
  });

  test("maps backend errors to operational user messages", () => {
    const staleMessage = getKpiEntryMutationErrorMessage(
      buildFailure({
        code: "CONFLICT_STALE_WRITE",
        message: "The KPI entry was updated by another user."
      })
    );
    const lockedMessage = getKpiEntryMutationErrorMessage(
      buildFailure({
        code: "CONFLICT_ENTRY_LOCKED",
        message: "Locked."
      })
    );
    const validationMessage = getKpiEntryMutationErrorMessage(
      buildFailure({
        code: "VALIDATION_FAILED",
        message: "Request validation failed.",
        details: [{ field: "value.progress_value", issue: "must_be_between_0_and_1" }]
      })
    );

    expect(staleMessage).toBe("This KPI was updated by someone else. Refresh and try again.");
    expect(lockedMessage).toBe("This KPI is locked and can no longer be edited.");
    expect(validationMessage).toContain("Please check the entered values and try again.");
    expect(validationMessage).toContain("Check that progress is a number between 0 and 1.");
  });

  test("keeps Thai-ready message mapping available", () => {
    const message = getKpiEntryMutationErrorMessage(
      buildFailure({
        code: "CONFLICT_REPORTING_PERIOD_CLOSED",
        message: "Closed."
      }),
      "th"
    );

    expect(message).toBe("รอบรายงานนี้ถูกปิดแล้ว ไม่สามารถแก้ไขข้อมูลได้");
  });

  test("formats readable audit summaries for combined updates", () => {
    const item: AuditHistoryItem = {
      audit_event_id: "aud_01",
      action: "kpi_entry.submitted",
      actor_username: "editor.user",
      occurred_at: "2026-05-29T10:00:00Z",
      summary: "Submitted KPI entry after value update.",
      changed_fields: ["status", "value.actual_value", "value.progress_value"],
      old_summary: {
        status: "pending",
        actual_value: "89",
        progress_value: 0.89
      },
      new_summary: {
        status: "submitted",
        actual_value: "92",
        progress_value: 0.92
      }
    };

    const presentation = formatAuditHistoryItem(item);

    expect(presentation.title).toContain("submitted this KPI");
    expect(presentation.changedFieldsLabel).toBe("status, actual value and progress value");
    expect(presentation.previousStateLabel).toContain("Status pending");
    expect(presentation.nextStateLabel).toContain("Status submitted");
  });

  test("keeps status options constrained to the conservative workflow", () => {
    expect(getAllowedNextStatuses("draft")).toEqual(["draft", "pending", "locked"]);
    expect(getAllowedNextStatuses("pending")).toEqual(["pending", "submitted", "locked"]);
    expect(getAllowedNextStatuses("submitted")).toEqual(["submitted", "pending", "locked"]);
  });
});
