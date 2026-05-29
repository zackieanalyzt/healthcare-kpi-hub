import type { Database } from "bun:sqlite";
import type {
  EntryValuePayload,
  KpiDefinitionSummary,
  KpiEntryDetail,
  KpiEntryMutationRequest,
  KpiEntryMutationValueInput
} from "@healthcare-kpi-hub/shared-types";
import { AppError } from "../../domain/shared/errors";
import { getRecentAuditHistoryForEntity, recordAuditEvent } from "../audit/service";
import { getDefinitionSummary } from "../kpi-definitions/service";
import { getKpiPageContext } from "../navigation/service";
import { getReportingPeriodSummary } from "../reporting-periods/service";
import {
  findEntryValuePayload,
  findKpiEntryCoreRecord,
  findKpiEntryMutationRecord,
  updateKpiEntryRecord,
  upsertEntryValueRecord
} from "./repository";

const ALLOWED_STATUS_TRANSITIONS = new Map<string, Set<string>>([
  ["draft", new Set(["pending", "locked"])],
  ["pending", new Set(["submitted", "locked"])],
  ["submitted", new Set(["pending", "locked"])],
  ["locked", new Set<string>()]
]);

interface MutationActor {
  userId: string;
  username: string;
}

interface ValidatedMutationPayload {
  updatedAt: string;
  status?: "draft" | "pending" | "submitted" | "locked";
  value: KpiEntryMutationValueInput;
}

interface ChangeSummary {
  changedFields: string[];
  nextStatus: string;
  nextValue: EntryValuePayload;
}

export function getKpiEntryDetail(
  db: Database,
  entryId: string,
  currentUsername: string | null
): KpiEntryDetail {
  const core = findKpiEntryCoreRecord(db, entryId, currentUsername);

  if (!core) {
    throw new AppError("NOT_FOUND_KPI_ENTRY", "KPI entry not found.", 404);
  }

  const definition = getDefinitionSummary(db, core.definition_id);
  const reportingPeriod = getReportingPeriodSummary(db, core.reporting_period_id);
  const pageContext = getKpiPageContext(db, core.page_id);

  if (!definition || !reportingPeriod || !pageContext) {
    throw new AppError(
      "NOT_FOUND_KPI_ENTRY_CONTEXT",
      "KPI entry context is missing or inactive.",
      404
    );
  }

  return {
    entry: core.entry,
    definition,
    value: findEntryValuePayload(db, entryId),
    reporting_period: reportingPeriod,
    page: pageContext.page,
    hierarchy: pageContext.hierarchy,
    history: getRecentAuditHistoryForEntity(db, "kpi_entry", entryId, 10)
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateIsoTimestamp(value: string): boolean {
  if (!value) {
    return false;
  }

  const isoPattern =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
  const parsed = new Date(value);
  return isoPattern.test(value) && !Number.isNaN(parsed.getTime());
}

function validateMutationPayload(payload: unknown): ValidatedMutationPayload {
  if (!isPlainObject(payload)) {
    throw new AppError("VALIDATION_FAILED", "Request validation failed.", 400, [
      { field: "body", issue: "must_be_object" }
    ]);
  }

  const details: Array<{ field: string; issue: string }> = [];
  const allowedTopLevel = new Set(["updated_at", "status", "value"]);
  const allowedValueFields = new Set(["actual_value", "progress_value", "note"]);

  for (const key of Object.keys(payload)) {
    if (!allowedTopLevel.has(key)) {
      details.push({ field: key, issue: "unsupported_field" });
    }
  }

  const updatedAt = payload.updated_at;
  if (typeof updatedAt !== "string" || !validateIsoTimestamp(updatedAt)) {
    details.push({ field: "updated_at", issue: "must_be_iso_timestamp" });
  }

  let status: ValidatedMutationPayload["status"];
  if (payload.status !== undefined) {
    if (
      payload.status === "draft" ||
      payload.status === "pending" ||
      payload.status === "submitted" ||
      payload.status === "locked"
    ) {
      status = payload.status;
    } else {
      details.push({ field: "status", issue: "unsupported_value" });
    }
  }

  const valueInput: KpiEntryMutationValueInput = {};
  if (payload.value !== undefined) {
    if (!isPlainObject(payload.value)) {
      details.push({ field: "value", issue: "must_be_object" });
    } else {
      for (const key of Object.keys(payload.value)) {
        if (!allowedValueFields.has(key)) {
          details.push({ field: `value.${key}`, issue: "unsupported_field" });
        }
      }

      if (payload.value.actual_value !== undefined) {
        if (
          typeof payload.value.actual_value !== "string" ||
          payload.value.actual_value.length > 100
        ) {
          details.push({ field: "value.actual_value", issue: "invalid_length_or_type" });
        } else {
          valueInput.actual_value = payload.value.actual_value;
        }
      }

      if (payload.value.progress_value !== undefined) {
        if (
          typeof payload.value.progress_value !== "number" ||
          !Number.isFinite(payload.value.progress_value) ||
          payload.value.progress_value < 0 ||
          payload.value.progress_value > 1
        ) {
          details.push({ field: "value.progress_value", issue: "must_be_between_0_and_1" });
        } else {
          valueInput.progress_value = payload.value.progress_value;
        }
      }

      if (payload.value.note !== undefined) {
        if (typeof payload.value.note !== "string" || payload.value.note.length > 2000) {
          details.push({ field: "value.note", issue: "invalid_length_or_type" });
        } else {
          valueInput.note = payload.value.note;
        }
      }
    }
  }

  if (status === undefined && Object.keys(valueInput).length === 0) {
    details.push({ field: "body", issue: "no_mutable_fields_provided" });
  }

  if (details.length > 0) {
    throw new AppError("VALIDATION_FAILED", "Request validation failed.", 400, details);
  }

  return {
    updatedAt: updatedAt as string,
    status,
    value: valueInput
  };
}

function validatePresetAndValueTypeRules(
  definition: KpiDefinitionSummary,
  valueInput: KpiEntryMutationValueInput
): void {
  const details: Array<{ field: string; issue: string }> = [];
  const hasActual = valueInput.actual_value !== undefined;
  const hasProgress = valueInput.progress_value !== undefined;

  if (
    (definition.value_type === "note" || definition.preset_code === "note") &&
    (hasActual || hasProgress)
  ) {
    if (hasActual) {
      details.push({ field: "value.actual_value", issue: "unsupported_for_note_kpi" });
    }
    if (hasProgress) {
      details.push({ field: "value.progress_value", issue: "unsupported_for_note_kpi" });
    }
  }

  if (hasActual && definition.value_type === "percentage") {
    const numericValue = Number(valueInput.actual_value);
    if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100) {
      details.push({ field: "value.actual_value", issue: "must_be_percentage_0_to_100" });
    }
  }

  if (hasActual && definition.preset_code === "numeric_target_actual") {
    const numericValue = Number(valueInput.actual_value);
    if (!Number.isFinite(numericValue)) {
      details.push({ field: "value.actual_value", issue: "must_be_numeric" });
    }
  }

  if (details.length > 0) {
    throw new AppError(
      "CONFLICT_VALUE_RULE_VIOLATION",
      "The KPI value payload violates definition rules.",
      409,
      details
    );
  }
}

function buildNextValue(
  currentValue: EntryValuePayload,
  valueInput: KpiEntryMutationValueInput
): EntryValuePayload {
  return {
    target_value: currentValue.target_value,
    actual_value:
      valueInput.actual_value !== undefined ? valueInput.actual_value : currentValue.actual_value,
    progress_value:
      valueInput.progress_value !== undefined
        ? valueInput.progress_value
        : currentValue.progress_value,
    note: valueInput.note !== undefined ? valueInput.note : currentValue.note,
    extra_json: currentValue.extra_json
  };
}

function determineChangeSummary(
  currentStatus: string,
  nextStatusCandidate: string | undefined,
  currentValue: EntryValuePayload,
  nextValue: EntryValuePayload
): ChangeSummary {
  const nextStatus = nextStatusCandidate ?? currentStatus;
  const changedFields: string[] = [];

  if (nextStatusCandidate !== undefined) {
    if (nextStatusCandidate === currentStatus) {
      throw new AppError(
        "CONFLICT_INVALID_STATUS_TRANSITION",
        "The requested KPI entry status transition is not allowed.",
        409,
        [{ field: "status", issue: "same_status_not_allowed" }]
      );
    }

    const allowedTargets = ALLOWED_STATUS_TRANSITIONS.get(currentStatus) ?? new Set<string>();
    if (!allowedTargets.has(nextStatusCandidate)) {
      throw new AppError(
        "CONFLICT_INVALID_STATUS_TRANSITION",
        "The requested KPI entry status transition is not allowed.",
        409,
        [{ field: "status", issue: "transition_not_allowed" }]
      );
    }

    changedFields.push("status");
  }

  if (nextValue.actual_value !== currentValue.actual_value) {
    changedFields.push("value.actual_value");
  }

  if (nextValue.progress_value !== currentValue.progress_value) {
    changedFields.push("value.progress_value");
  }

  if (nextValue.note !== currentValue.note) {
    changedFields.push("value.note");
  }

  if (changedFields.length === 0) {
    throw new AppError("VALIDATION_FAILED", "Request validation failed.", 400, [
      { field: "body", issue: "no_effective_changes" }
    ]);
  }

  return {
    changedFields,
    nextStatus,
    nextValue
  };
}

function summarizeState(
  status: string,
  value: EntryValuePayload
): Record<string, unknown> {
  return {
    status,
    actual_value: value.actual_value,
    progress_value: value.progress_value,
    note: value.note
  };
}

function resolveAuditAction(
  previousStatus: string,
  nextStatus: string,
  changedFields: string[]
): string {
  if (previousStatus !== nextStatus) {
    if (previousStatus === "pending" && nextStatus === "submitted") {
      return "kpi_entry.submitted";
    }

    if (previousStatus === "submitted" && nextStatus === "pending") {
      return "kpi_entry.returned";
    }

    if (nextStatus === "locked") {
      return "kpi_entry.locked";
    }

    return "kpi_entry.status_changed";
  }

  if (changedFields.some((field) => field.startsWith("value."))) {
    return "kpi_entry.value_updated";
  }

  return "kpi_entry.status_changed";
}

function buildAuditSummary(action: string, changedFields: string[]): string {
  const fieldList = changedFields.join(", ");

  switch (action) {
    case "kpi_entry.submitted":
      return `Submitted KPI entry with changes to ${fieldList}.`;
    case "kpi_entry.returned":
      return `Returned KPI entry to pending with changes to ${fieldList}.`;
    case "kpi_entry.locked":
      return `Locked KPI entry with changes to ${fieldList}.`;
    case "kpi_entry.status_changed":
      return `Changed KPI entry workflow state with changes to ${fieldList}.`;
    default:
      return `Updated KPI entry fields: ${fieldList}.`;
  }
}

export function updateKpiEntry(
  db: Database,
  entryId: string,
  payload: unknown,
  actor: MutationActor
): KpiEntryDetail {
  const validatedPayload = validateMutationPayload(payload);
  const current = findKpiEntryMutationRecord(db, entryId);

  if (!current) {
    throw new AppError("NOT_FOUND_KPI_ENTRY", "KPI entry not found.", 404);
  }

  const definition = getDefinitionSummary(db, current.definition_id);
  const reportingPeriod = getReportingPeriodSummary(db, current.reporting_period_id);
  const pageContext = getKpiPageContext(db, current.page_id);

  if (!definition || !reportingPeriod || !pageContext) {
    throw new AppError(
      "NOT_FOUND_KPI_ENTRY_CONTEXT",
      "KPI entry context is missing or inactive.",
      404
    );
  }

  if (reportingPeriod.status !== "open") {
    throw new AppError(
      "CONFLICT_REPORTING_PERIOD_CLOSED",
      "The KPI entry cannot be updated because the reporting period is not open.",
      409,
      [{ field: "reporting_period", issue: "must_be_open" }]
    );
  }

  if (current.status === "locked") {
    throw new AppError(
      "CONFLICT_ENTRY_LOCKED",
      "The KPI entry is locked and cannot be updated.",
      409,
      [{ field: "status", issue: "locked" }]
    );
  }

  if (validatedPayload.updatedAt !== current.updated_at) {
    throw new AppError(
      "CONFLICT_STALE_WRITE",
      "The KPI entry was updated by another user.",
      409,
      [{ field: "updated_at", issue: "stale_value" }]
    );
  }

  validatePresetAndValueTypeRules(definition, validatedPayload.value);

  const currentValue: EntryValuePayload = {
    target_value: current.target_value,
    actual_value: current.actual_value,
    progress_value: current.progress_value,
    note: current.note,
    extra_json: current.extra_json
  };

  const changeSummary = determineChangeSummary(
    current.status,
    validatedPayload.status,
    currentValue,
    buildNextValue(currentValue, validatedPayload.value)
  );

  const mutationTimestamp = new Date().toISOString();
  const auditAction = resolveAuditAction(
    current.status,
    changeSummary.nextStatus,
    changeSummary.changedFields
  );
  const auditSummary = buildAuditSummary(auditAction, changeSummary.changedFields);

  const transaction = db.transaction(() => {
    updateKpiEntryRecord(
      db,
      entryId,
      changeSummary.nextStatus,
      mutationTimestamp,
      actor.userId
    );

    if (changeSummary.changedFields.some((field) => field.startsWith("value."))) {
      upsertEntryValueRecord(db, {
        id: current.entry_value_id ?? `val_${crypto.randomUUID()}`,
        entryId,
        targetValue: current.target_value,
        actualValue: changeSummary.nextValue.actual_value,
        progressValue: changeSummary.nextValue.progress_value,
        note: changeSummary.nextValue.note,
        extraJson: current.extra_json,
        updatedAt: mutationTimestamp
      });
    }

    recordAuditEvent(db, {
      entityType: "kpi_entry",
      entityId: entryId,
      action: auditAction,
      actorUserId: actor.userId,
      actorUsername: actor.username,
      payload: {
        entry_id: entryId,
        definition_id: current.definition_id,
        reporting_period_id: current.reporting_period_id,
        page_id: current.page_id,
        actor_user_id: actor.userId,
        actor_username: actor.username,
        changed_fields: changeSummary.changedFields,
        old_summary: summarizeState(current.status, currentValue),
        new_summary: summarizeState(changeSummary.nextStatus, changeSummary.nextValue),
        summary: auditSummary
      }
    });
  });

  transaction();

  return getKpiEntryDetail(db, entryId, actor.username);
}
