import type {
  ApiFailure,
  AuditHistoryItem,
  KpiEntryDetail,
  KpiEntryMutationRequest
} from "@healthcare-kpi-hub/shared-types";

export type KpiEntryUiLocale = "en" | "th";

export interface KpiEntryMutationDraft {
  status: string;
  actualValue: string;
  progressValue: string;
  note: string;
}

export interface KpiEntryAuditPresentation {
  title: string;
  changedFieldsLabel: string | null;
  previousStateLabel: string | null;
  nextStateLabel: string | null;
}

const ERROR_MESSAGES = {
  en: {
    VALIDATION_FAILED: "Please check the entered values and try again.",
    AUTH_FORBIDDEN: "You do not have permission to edit this KPI.",
    NOT_FOUND_KPI_ENTRY: "This KPI entry could not be found.",
    NOT_FOUND_KPI_ENTRY_CONTEXT:
      "This KPI entry has missing or inactive related information.",
    CONFLICT_STALE_WRITE:
      "This KPI was updated by someone else. Refresh and try again.",
    CONFLICT_ENTRY_LOCKED: "This KPI is locked and can no longer be edited.",
    CONFLICT_REPORTING_PERIOD_CLOSED:
      "This reporting period is closed.",
    CONFLICT_INVALID_STATUS_TRANSITION:
      "This status change is not allowed.",
    CONFLICT_VALUE_RULE_VIOLATION:
      "The value does not match the KPI rule.",
    NETWORK_ERROR: "Unable to save KPI entry changes right now.",
    NO_EFFECTIVE_CHANGES: "Make a change before saving.",
    PROGRESS_CLEARING_DEFERRED:
      "Progress value cannot be cleared in this release.",
    PROGRESS_INVALID: "Progress must be a number between 0 and 1."
  },
  th: {
    VALIDATION_FAILED: "กรุณาตรวจสอบค่าที่กรอกแล้วลองอีกครั้ง",
    AUTH_FORBIDDEN: "คุณไม่มีสิทธิ์แก้ไขรายการ KPI นี้",
    NOT_FOUND_KPI_ENTRY: "ไม่พบรายการ KPI นี้",
    NOT_FOUND_KPI_ENTRY_CONTEXT:
      "รายการ KPI นี้มีข้อมูลอ้างอิงที่ขาดหายหรือไม่ได้เปิดใช้งาน",
    CONFLICT_STALE_WRITE:
      "รายการ KPI นี้ถูกแก้ไขโดยผู้อื่นแล้ว กรุณาโหลดข้อมูลใหม่ก่อนบันทึกอีกครั้ง",
    CONFLICT_ENTRY_LOCKED:
      "รายการ KPI นี้ถูกล็อกแล้ว ไม่สามารถแก้ไขได้",
    CONFLICT_REPORTING_PERIOD_CLOSED:
      "รอบรายงานนี้ถูกปิดแล้ว ไม่สามารถแก้ไขข้อมูลได้",
    CONFLICT_INVALID_STATUS_TRANSITION:
      "ไม่สามารถเปลี่ยนสถานะรายการ KPI ตามลำดับนี้ได้",
    CONFLICT_VALUE_RULE_VIOLATION: "ค่าที่กรอกไม่เป็นไปตามกฎของ KPI",
    NETWORK_ERROR: "ยังไม่สามารถบันทึกการแก้ไข KPI ได้ในขณะนี้",
    NO_EFFECTIVE_CHANGES: "กรุณาแก้ไขข้อมูลอย่างน้อยหนึ่งรายการก่อนบันทึก",
    PROGRESS_CLEARING_DEFERRED:
      "ยังไม่รองรับการล้างค่า progress ในรอบการพัฒนานี้",
    PROGRESS_INVALID: "ค่า progress ต้องเป็นตัวเลขระหว่าง 0 และ 1"
  }
} as const;

const LEVEL_LABELS = {
  en: {
    organization: "Organization",
    department: "Department",
    unit: "Unit / Team",
    individual: "Individual"
  },
  th: {
    organization: "ระดับองค์กร",
    department: "ระดับหน่วยงาน",
    unit: "ระดับทีม / หน่วยย่อย",
    individual: "ระดับบุคคล"
  }
} as const;

const FIELD_LABELS = {
  en: {
    status: "status",
    "value.actual_value": "actual value",
    "value.progress_value": "progress value",
    "value.note": "note"
  },
  th: {
    status: "สถานะ",
    "value.actual_value": "ค่า actual",
    "value.progress_value": "ค่า progress",
    "value.note": "หมายเหตุ"
  }
} as const;

const STATUS_LABELS = {
  en: {
    draft: "draft",
    pending: "pending",
    submitted: "submitted",
    locked: "locked"
  },
  th: {
    draft: "draft",
    pending: "pending",
    submitted: "submitted",
    locked: "locked"
  }
} as const;

function joinLabels(items: string[], locale: KpiEntryUiLocale): string {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (locale === "th") {
    return `${items.slice(0, -1).join(", ")} และ ${items[items.length - 1]}`;
  }

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function labelField(
  field: keyof typeof FIELD_LABELS.en,
  locale: KpiEntryUiLocale
): string {
  return FIELD_LABELS[locale][field];
}

function labelStatus(status: unknown, locale: KpiEntryUiLocale): string | null {
  if (typeof status !== "string") {
    return null;
  }

  return STATUS_LABELS[locale][status as keyof typeof STATUS_LABELS.en] ?? status;
}

function summarizeChangedFields(
  changedFields: string[] | null | undefined,
  locale: KpiEntryUiLocale
): string | null {
  if (!changedFields || changedFields.length === 0) {
    return null;
  }

  const labels = changedFields.map((field) => {
    if (field in FIELD_LABELS[locale]) {
      return FIELD_LABELS[locale][field as keyof typeof FIELD_LABELS.en];
    }

    return field;
  });

  return joinLabels(labels, locale);
}

function summarizeValueFieldsOnly(
  changedFields: string[] | null | undefined,
  locale: KpiEntryUiLocale
) {
  return summarizeChangedFields(
    changedFields?.filter((field) => field !== "status"),
    locale
  );
}

function pickSummaryValue(
  summary: Record<string, unknown> | null | undefined,
  field: "status" | "actual_value" | "progress_value" | "note"
): unknown {
  return summary?.[field] ?? null;
}

function summarizeState(
  summary: Record<string, unknown> | null | undefined,
  changedFields: string[] | null | undefined,
  locale: KpiEntryUiLocale
): string | null {
  if (!summary) {
    return null;
  }

  const fragments: string[] = [];
  const includeStatus = changedFields?.includes("status") ?? false;
  const includeActual = changedFields?.includes("value.actual_value") ?? false;
  const includeProgress = changedFields?.includes("value.progress_value") ?? false;
  const includeNote = changedFields?.includes("value.note") ?? false;

  if (includeStatus) {
    const status = labelStatus(pickSummaryValue(summary, "status"), locale);
    if (status) {
      fragments.push(
        locale === "th" ? `สถานะ ${status}` : `Status ${status}`
      );
    }
  }

  if (includeActual) {
    const value = pickSummaryValue(summary, "actual_value");
    fragments.push(
      locale === "th"
        ? `ค่า actual ${value ?? "-"}`
        : `Actual ${value ?? "-"}`
    );
  }

  if (includeProgress) {
    const value = pickSummaryValue(summary, "progress_value");
    fragments.push(
      locale === "th"
        ? `ค่า progress ${value ?? "-"}`
        : `Progress ${value ?? "-"}`
    );
  }

  if (includeNote) {
    const value = pickSummaryValue(summary, "note");
    fragments.push(
      locale === "th" ? `หมายเหตุ ${value ?? "-"}` : `Note ${value ?? "-"}`
    );
  }

  if (fragments.length === 0) {
    return null;
  }

  return fragments.join(locale === "th" ? " | " : " | ");
}

export function renderHierarchyLevel(
  level: KpiEntryDetail["hierarchy"]["current_node"]["hierarchy_level"],
  locale: KpiEntryUiLocale = "en"
) {
  return LEVEL_LABELS[locale][level] ?? level;
}

export function getAllowedNextStatuses(status: string) {
  switch (status) {
    case "draft":
      return ["draft", "pending", "locked"];
    case "pending":
      return ["pending", "submitted", "locked"];
    case "submitted":
      return ["submitted", "pending", "locked"];
    default:
      return [status];
  }
}

function getValidationHint(
  error: ApiFailure["error"],
  locale: KpiEntryUiLocale
): string | null {
  const firstDetail = error.details?.[0];
  if (!firstDetail) {
    return null;
  }

  if (locale === "th") {
    switch (firstDetail.field) {
      case "value.progress_value":
        return "ตรวจสอบค่า progress ให้อยู่ระหว่าง 0 และ 1";
      case "value.actual_value":
        return "ตรวจสอบค่า actual ที่กรอก";
      case "value.note":
        return "ตรวจสอบความยาวของหมายเหตุ";
      case "status":
        return "เลือกสถานะที่ระบบอนุญาต";
      case "body":
        if (firstDetail.issue === "no_mutable_fields_provided" || firstDetail.issue === "no_effective_changes") {
          return "แก้ไขข้อมูลอย่างน้อยหนึ่งรายการก่อนบันทึก";
        }
        return null;
      default:
        return null;
    }
  }

  switch (firstDetail.field) {
    case "value.progress_value":
      return "Check that progress is a number between 0 and 1.";
    case "value.actual_value":
      return "Check the actual value.";
    case "value.note":
      return "Check the note length.";
    case "status":
      return "Choose an allowed status.";
    case "body":
      if (firstDetail.issue === "no_mutable_fields_provided" || firstDetail.issue === "no_effective_changes") {
        return "Make at least one change before saving.";
      }
      return null;
    default:
      return null;
  }
}

export function getKpiEntryMutationErrorMessage(
  error: ApiFailure["error"],
  locale: KpiEntryUiLocale = "en"
): string {
  const baseMessage =
    ERROR_MESSAGES[locale][error.code as keyof typeof ERROR_MESSAGES.en] ?? error.message;

  if (error.code !== "VALIDATION_FAILED") {
    return baseMessage;
  }

  const hint = getValidationHint(error, locale);
  return hint ? `${baseMessage} ${hint}` : baseMessage;
}

export function getClientMutationMessage(
  code: "NETWORK_ERROR" | "NO_EFFECTIVE_CHANGES" | "PROGRESS_CLEARING_DEFERRED" | "PROGRESS_INVALID",
  locale: KpiEntryUiLocale = "en"
) {
  return ERROR_MESSAGES[locale][code];
}

export function buildConservativeMutationPayload(
  detail: KpiEntryDetail,
  draft: KpiEntryMutationDraft,
  locale: KpiEntryUiLocale = "en"
):
  | { ok: true; payload: KpiEntryMutationRequest }
  | { ok: false; message: string } {
  const payload: KpiEntryMutationRequest = {
    updated_at: detail.entry.updated_at
  };

  if (draft.status !== detail.entry.status) {
    payload.status = draft.status;
  }

  const value: KpiEntryMutationRequest["value"] = {};
  if (draft.actualValue !== (detail.value.actual_value ?? "")) {
    value.actual_value = draft.actualValue;
  }

  const currentProgress =
    detail.value.progress_value === null ? "" : String(detail.value.progress_value);
  if (draft.progressValue !== currentProgress) {
    if (draft.progressValue.trim() === "") {
      return {
        ok: false,
        message: getClientMutationMessage("PROGRESS_CLEARING_DEFERRED", locale)
      };
    }

    const numericProgress = Number(draft.progressValue);
    if (!Number.isFinite(numericProgress) || numericProgress < 0 || numericProgress > 1) {
      return {
        ok: false,
        message: getClientMutationMessage("PROGRESS_INVALID", locale)
      };
    }

    value.progress_value = numericProgress;
  }

  if (draft.note !== (detail.value.note ?? "")) {
    value.note = draft.note;
  }

  if (Object.keys(value).length > 0) {
    payload.value = value;
  }

  if (!payload.status && !payload.value) {
    return {
      ok: false,
      message: getClientMutationMessage("NO_EFFECTIVE_CHANGES", locale)
    };
  }

  return { ok: true, payload };
}

export function formatAuditHistoryItem(
  item: AuditHistoryItem,
  locale: KpiEntryUiLocale = "en"
): KpiEntryAuditPresentation {
  const actor = item.actor_username ?? (locale === "th" ? "ผู้ใช้ระบบ" : "System user");
  const changedFieldsText = summarizeChangedFields(item.changed_fields, locale);
  const changedValueFieldsText = summarizeValueFieldsOnly(item.changed_fields, locale);
  const previousStateLabel = summarizeState(item.old_summary, item.changed_fields, locale);
  const nextStateLabel = summarizeState(item.new_summary, item.changed_fields, locale);
  const previousStatus = labelStatus(item.old_summary?.status, locale);
  const nextStatus = labelStatus(item.new_summary?.status, locale);

  let title = item.summary ?? item.action;

  switch (item.action) {
    case "kpi_entry.value_updated":
      title =
        locale === "th"
          ? `${actor} แก้ไข${changedFieldsText ? changedFieldsText : "ข้อมูล KPI"}`
          : `${actor} updated ${changedFieldsText ?? "this KPI entry"}.`;
      break;
    case "kpi_entry.submitted":
      title =
        locale === "th"
          ? changedValueFieldsText
            ? `${actor} แก้ไข${changedValueFieldsText} และส่งรายการ KPI นี้แล้ว`
            : `${actor} ส่งรายการ KPI นี้แล้ว`
          : changedValueFieldsText
            ? `${actor} updated ${changedValueFieldsText} and submitted this KPI.`
            : `${actor} submitted this KPI.`;
      break;
    case "kpi_entry.returned":
      title =
        locale === "th"
          ? changedValueFieldsText
            ? `${actor} แก้ไข${changedValueFieldsText} และส่งรายการ KPI นี้กลับเป็น pending`
            : `${actor} ส่งรายการ KPI นี้กลับเป็น pending`
          : changedValueFieldsText
            ? `${actor} updated ${changedValueFieldsText} and returned this KPI to pending.`
            : `${actor} returned this KPI to pending.`;
      break;
    case "kpi_entry.locked":
      title =
        locale === "th"
          ? changedValueFieldsText
            ? `${actor} แก้ไข${changedValueFieldsText} และล็อกรายการ KPI นี้`
            : `${actor} ล็อกรายการ KPI นี้`
          : changedValueFieldsText
            ? `${actor} updated ${changedValueFieldsText} and locked this KPI.`
            : `${actor} locked this KPI.`;
      break;
    case "kpi_entry.status_changed":
      title =
        locale === "th"
          ? previousStatus && nextStatus
            ? `${actor} เปลี่ยนสถานะจาก ${previousStatus} เป็น ${nextStatus}`
            : `${actor} เปลี่ยนสถานะรายการ KPI นี้`
          : previousStatus && nextStatus
            ? `${actor} changed status from ${previousStatus} to ${nextStatus}.`
            : `${actor} changed this KPI status.`;
      break;
    default:
      break;
  }

  return {
    title,
    changedFieldsLabel: changedFieldsText,
    previousStateLabel,
    nextStateLabel
  };
}
