import {
  DASHBOARD_ACHIEVEMENT_STATUS,
  DASHBOARD_ALLOWED_AGGREGATION_METHODS_BY_MEASUREMENT_TYPE,
  DASHBOARD_BOOLEAN_VALUE_LABELS,
  DASHBOARD_METADATA_VALIDATION,
  DASHBOARD_MEASUREMENT_TYPE,
  DASHBOARD_MILESTONE_RULE_SCHEMA,
  DASHBOARD_RISK_STATUS,
  DASHBOARD_RUNTIME_RULES,
  DASHBOARD_SCOPES,
  DASHBOARD_STATUS_RULES,
  DASHBOARD_SUMMARY_CARD_CODES,
  DASHBOARD_SUMMARY_CARD_LABELS,
  DASHBOARD_THRESHOLD_RULE_SCHEMA,
  DASHBOARD_WARNING_CODE,
  DASHBOARD_WARNING_MESSAGES
} from "@healthcare-kpi-hub/config";
import type {
  DashboardAchievementStatus,
  DashboardDataQualityWarning,
  DashboardLineageRecord,
  DashboardOrganizationSummary,
  DashboardRiskStatus,
  DashboardWarningCode
} from "@healthcare-kpi-hub/shared-types";
import type { Database } from "bun:sqlite";
import { AppError } from "../../domain/shared/errors";
import {
  findDashboardReportingPeriod,
  findOrganizationScopeRoot,
  listAmbiguousScopeRecords,
  listOrganizationEntryRecords,
  type DashboardOrganizationEntryRecord
} from "./repository";

interface ThresholdRuleBand {
  status: DashboardRiskStatus;
  operator?: string;
  value?: string | number | boolean;
  min_value?: string | number | null;
  max_value?: string | number | null;
}

interface ThresholdRuleConfig {
  bands: ThresholdRuleBand[];
}

function normalizeWorkflowStatus(status: string): string {
  return (
    DASHBOARD_STATUS_RULES.workflowStatusMap[
      status as keyof typeof DASHBOARD_STATUS_RULES.workflowStatusMap
    ] ?? status
  );
}

function parseJsonObject<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function parseNumericValue(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseBooleanValue(value: string | null): boolean | null {
  if (value === null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (DASHBOARD_BOOLEAN_VALUE_LABELS.trueValues.includes(normalized as never)) {
    return true;
  }

  if (DASHBOARD_BOOLEAN_VALUE_LABELS.falseValues.includes(normalized as never)) {
    return false;
  }

  return null;
}

function isStale(updatedAt: string, calculationTimestamp: string): boolean {
  const updatedAtMs = new Date(updatedAt).getTime();
  const calculationTimestampMs = new Date(calculationTimestamp).getTime();

  if (Number.isNaN(updatedAtMs) || Number.isNaN(calculationTimestampMs)) {
    return false;
  }

  const maxAgeMs =
    DASHBOARD_RUNTIME_RULES.staleProgressMaxAgeDays * 24 * 60 * 60 * 1000;

  return calculationTimestampMs - updatedAtMs > maxAgeMs;
}

function buildWarning(
  code: DashboardWarningCode,
  record: DashboardOrganizationEntryRecord | null,
  entryId?: string | null
): DashboardDataQualityWarning {
  return {
    code,
    message: DASHBOARD_WARNING_MESSAGES[code],
    kpi_definition_id: record?.definition_id ?? null,
    kpi_entry_id: entryId ?? record?.entry_id ?? null
  };
}

function deriveComparableValue(record: DashboardOrganizationEntryRecord):
  | number
  | boolean
  | null {
  switch (record.measurement_type) {
    case DASHBOARD_MEASUREMENT_TYPE.PERCENTAGE:
    case DASHBOARD_MEASUREMENT_TYPE.COUNT:
    case DASHBOARD_MEASUREMENT_TYPE.MILESTONE:
      return parseNumericValue(record.actual_value);
    case DASHBOARD_MEASUREMENT_TYPE.BOOLEAN:
      return parseBooleanValue(record.actual_value);
    default:
      return null;
  }
}

function compareNumeric(
  operator: string,
  actualValue: number,
  targetValue: number
): boolean | null {
  switch (operator) {
    case ">=":
      return actualValue >= targetValue;
    case ">":
      return actualValue > targetValue;
    case "<=":
      return actualValue <= targetValue;
    case "<":
      return actualValue < targetValue;
    case "=":
      return actualValue === targetValue;
    default:
      return null;
  }
}

function compareBoolean(actualValue: boolean, targetValue: string): boolean | null {
  const parsedTarget = parseBooleanValue(targetValue);
  if (parsedTarget === null) {
    return null;
  }

  return actualValue === parsedTarget;
}

function deriveAchievementStatus(
  record: DashboardOrganizationEntryRecord
): DashboardAchievementStatus {
  if (
    !record.measurement_type ||
    !DASHBOARD_METADATA_VALIDATION.requiredTargetRuleFields.every((field) => {
      switch (field) {
        case "measurement_type":
          return Boolean(record.measurement_type);
        case "target_operator":
          return Boolean(record.target_operator);
        case "target_value":
          return Boolean(record.target_value);
        case "target_direction":
          return Boolean(record.target_direction);
        default:
          return false;
      }
    })
  ) {
    return DASHBOARD_ACHIEVEMENT_STATUS.NOT_CONFIGURED;
  }

  if (
    record.measurement_type === DASHBOARD_MEASUREMENT_TYPE.MILESTONE &&
    DASHBOARD_METADATA_VALIDATION.milestoneRequiresLevels &&
    !record.milestone_levels
  ) {
    return DASHBOARD_ACHIEVEMENT_STATUS.NOT_CONFIGURED;
  }

  if (
    !DASHBOARD_ALLOWED_AGGREGATION_METHODS_BY_MEASUREMENT_TYPE[
      record.measurement_type as keyof typeof DASHBOARD_ALLOWED_AGGREGATION_METHODS_BY_MEASUREMENT_TYPE
    ]?.includes(record.aggregation_method as never)
  ) {
    return DASHBOARD_ACHIEVEMENT_STATUS.NOT_CONFIGURED;
  }

  if (record.actual_value === null) {
    return record.progress_value === null
      ? DASHBOARD_ACHIEVEMENT_STATUS.NOT_STARTED
      : DASHBOARD_ACHIEVEMENT_STATUS.IN_PROGRESS;
  }

  const comparableValue = deriveComparableValue(record);
  if (comparableValue === null) {
    return DASHBOARD_ACHIEVEMENT_STATUS.NOT_CONFIGURED;
  }

  if (
    typeof comparableValue === "number" &&
    record.target_operator &&
    record.target_value !== null
  ) {
    const numericTarget = parseNumericValue(record.target_value);
    if (numericTarget === null) {
      return DASHBOARD_ACHIEVEMENT_STATUS.NOT_CONFIGURED;
    }

    const matches = compareNumeric(
      record.target_operator,
      comparableValue,
      numericTarget
    );

    if (matches === null) {
      return DASHBOARD_ACHIEVEMENT_STATUS.NOT_CONFIGURED;
    }

    return matches
      ? DASHBOARD_ACHIEVEMENT_STATUS.ACHIEVED
      : DASHBOARD_ACHIEVEMENT_STATUS.NOT_ACHIEVED;
  }

  if (
    typeof comparableValue === "boolean" &&
    record.target_operator === "=" &&
    record.target_value !== null
  ) {
    const matches = compareBoolean(comparableValue, record.target_value);
    if (matches === null) {
      return DASHBOARD_ACHIEVEMENT_STATUS.NOT_CONFIGURED;
    }

    return matches
      ? DASHBOARD_ACHIEVEMENT_STATUS.ACHIEVED
      : DASHBOARD_ACHIEVEMENT_STATUS.NOT_ACHIEVED;
  }

  return DASHBOARD_ACHIEVEMENT_STATUS.NOT_CONFIGURED;
}

function compareThresholdBand(
  comparableValue: number | boolean,
  band: ThresholdRuleBand
): boolean {
  if (typeof comparableValue === "boolean") {
    if (typeof band.value !== "boolean") {
      return false;
    }

    return comparableValue === band.value;
  }

  if (band.operator && band.value !== undefined) {
    const numericTarget =
      typeof band.value === "number" ? band.value : parseNumericValue(String(band.value));

    if (numericTarget === null) {
      return false;
    }

    const result = compareNumeric(band.operator, comparableValue, numericTarget);
    return result === true;
  }

  const minValue =
    typeof band.min_value === "number"
      ? band.min_value
      : band.min_value !== undefined && band.min_value !== null
        ? parseNumericValue(String(band.min_value))
        : null;
  const maxValue =
    typeof band.max_value === "number"
      ? band.max_value
      : band.max_value !== undefined && band.max_value !== null
        ? parseNumericValue(String(band.max_value))
        : null;

  if (minValue === null && maxValue === null) {
    return false;
  }

  if (minValue !== null && comparableValue < minValue) {
    return false;
  }

  if (maxValue !== null && comparableValue > maxValue) {
    return false;
  }

  return true;
}

function deriveRiskStatus(
  record: DashboardOrganizationEntryRecord
): DashboardRiskStatus {
  const thresholdRules = parseJsonObject<ThresholdRuleConfig>(record.threshold_rules);
  if (
    !thresholdRules ||
    !Array.isArray(thresholdRules[DASHBOARD_THRESHOLD_RULE_SCHEMA.ruleCollectionKey])
  ) {
    return DASHBOARD_RISK_STATUS.NOT_CONFIGURED;
  }

  const comparableValue = deriveComparableValue(record);
  if (comparableValue === null) {
    return DASHBOARD_RISK_STATUS.NOT_CONFIGURED;
  }

  for (const band of thresholdRules[DASHBOARD_THRESHOLD_RULE_SCHEMA.ruleCollectionKey]) {
    if (
      !DASHBOARD_THRESHOLD_RULE_SCHEMA.allowedStatuses.includes(
        band.status as (typeof DASHBOARD_THRESHOLD_RULE_SCHEMA.allowedStatuses)[number]
      )
    ) {
      continue;
    }

    if (compareThresholdBand(comparableValue, band)) {
      return band.status;
    }
  }

  return DASHBOARD_RISK_STATUS.NOT_CONFIGURED;
}

function hasMissingTargetRule(record: DashboardOrganizationEntryRecord): boolean {
  return !DASHBOARD_METADATA_VALIDATION.requiredTargetRuleFields.every((field) => {
    switch (field) {
      case "measurement_type":
        return Boolean(record.measurement_type);
      case "target_operator":
        return Boolean(record.target_operator);
      case "target_value":
        return Boolean(record.target_value);
      case "target_direction":
        return Boolean(record.target_direction);
      default:
        return false;
    }
  });
}

function hasInvalidAggregationMethod(record: DashboardOrganizationEntryRecord): boolean {
  if (!record.measurement_type || !record.aggregation_method) {
    return true;
  }

  const allowedMethods =
    DASHBOARD_ALLOWED_AGGREGATION_METHODS_BY_MEASUREMENT_TYPE[
      record.measurement_type as keyof typeof DASHBOARD_ALLOWED_AGGREGATION_METHODS_BY_MEASUREMENT_TYPE
    ];

  return !allowedMethods?.includes(record.aggregation_method as never);
}

function isOverdue(
  record: DashboardOrganizationEntryRecord,
  calculationTimestamp: string
): boolean {
  const canonicalStatus = normalizeWorkflowStatus(record.entry_status);
  if (
    DASHBOARD_RUNTIME_RULES.allowExplicitOverdueStatus &&
    canonicalStatus === DASHBOARD_STATUS_RULES.workflowStatusMap.overdue
  ) {
    return true;
  }

  if (
    !DASHBOARD_STATUS_RULES.overdueSourceStatuses.includes(canonicalStatus as never) ||
    !record.due_at
  ) {
    return false;
  }

  const dueAt = new Date(record.due_at).getTime();
  const calculatedAt = new Date(calculationTimestamp).getTime();

  if (Number.isNaN(dueAt) || Number.isNaN(calculatedAt)) {
    return false;
  }

  return dueAt < calculatedAt;
}

function buildLineageRecord(
  record: DashboardOrganizationEntryRecord,
  calculationTimestamp: string
): DashboardLineageRecord {
  return {
    kpi_definition_id: record.definition_id,
    assignment_id: record.entry_id,
    scope_type: record.hierarchy_level ?? DASHBOARD_SCOPES.ORGANIZATION,
    scope_id: record.page_id,
    measurement_metadata_version_or_updated_at: record.definition_updated_at,
    calculation_timestamp: calculationTimestamp,
    source_entry_updated_at: record.entry_updated_at
  };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

export function getOrganizationDashboardSummary(
  db: Database,
  options?: { periodKey?: string }
): DashboardOrganizationSummary {
  const reportingPeriod = findDashboardReportingPeriod(db, options?.periodKey);
  if (!reportingPeriod) {
    throw new AppError(
      "NOT_FOUND_REPORTING_PERIOD",
      "Reporting period not found for dashboard summary.",
      404
    );
  }

  const organizationScope = findOrganizationScopeRoot(db);
  if (!organizationScope) {
    throw new AppError(
      "NOT_FOUND_ORGANIZATION_SCOPE",
      "Organization dashboard scope is not configured.",
      404
    );
  }

  const calculationTimestamp = new Date().toISOString();
  const warnings: DashboardDataQualityWarning[] = [];
  const lineage: DashboardLineageRecord[] = [];
  const ambiguousScopeRecords = listAmbiguousScopeRecords(
    db,
    organizationScope.page_id,
    reportingPeriod.id
  );

  for (const record of ambiguousScopeRecords) {
    warnings.push(
      buildWarning(DASHBOARD_WARNING_CODE.AMBIGUOUS_SCOPE, null, record.entry_id)
    );
  }

  const includedRecords = listOrganizationEntryRecords(
    db,
    organizationScope.page_id,
    reportingPeriod.id
  ).filter((record) => {
    const canonicalStatus = normalizeWorkflowStatus(record.entry_status);
    return DASHBOARD_STATUS_RULES.denominatorIncluded.includes(canonicalStatus as never);
  });

  let completedCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  let atRiskCount = 0;
  let achievementNumerator = 0;

  for (const record of includedRecords) {
    const canonicalStatus = normalizeWorkflowStatus(record.entry_status);
    const overdue = isOverdue(record, calculationTimestamp);

    if (!record.measurement_type) {
      warnings.push(buildWarning(DASHBOARD_WARNING_CODE.MISSING_MEASUREMENT_TYPE, record));
    }

    if (hasMissingTargetRule(record)) {
      warnings.push(buildWarning(DASHBOARD_WARNING_CODE.MISSING_TARGET_RULE, record));
    }

    if (!record.threshold_rules) {
      warnings.push(buildWarning(DASHBOARD_WARNING_CODE.MISSING_THRESHOLD_RULES, record));
    }

    if (
      record.measurement_type === DASHBOARD_MEASUREMENT_TYPE.MILESTONE &&
      (!parseJsonObject<Record<string, unknown>>(record.milestone_levels)?.[
        DASHBOARD_MILESTONE_RULE_SCHEMA.levelsKey
      ] ||
        !record.milestone_levels)
    ) {
      warnings.push(buildWarning(DASHBOARD_WARNING_CODE.MISSING_MILESTONE_LEVELS, record));
    }

    if (hasInvalidAggregationMethod(record)) {
      warnings.push(buildWarning(DASHBOARD_WARNING_CODE.INVALID_AGGREGATION_METHOD, record));
    }

    if (isStale(record.entry_updated_at, calculationTimestamp)) {
      warnings.push(buildWarning(DASHBOARD_WARNING_CODE.STALE_PROGRESS_DATA, record));
    }

    const achievementStatus = deriveAchievementStatus(record);
    const riskStatus = deriveRiskStatus(record);

    if (DASHBOARD_STATUS_RULES.completedStatuses.includes(canonicalStatus as never)) {
      completedCount += 1;
    }

    if (overdue) {
      overdueCount += 1;
    } else if (DASHBOARD_STATUS_RULES.pendingStatuses.includes(canonicalStatus as never)) {
      pendingCount += 1;
    }

    if (DASHBOARD_STATUS_RULES.atRiskStatuses.includes(riskStatus as never)) {
      atRiskCount += 1;
    }

    if (achievementStatus === DASHBOARD_ACHIEVEMENT_STATUS.ACHIEVED) {
      achievementNumerator += 1;
    }

    lineage.push(buildLineageRecord(record, calculationTimestamp));
  }

  const achievementDenominator = includedRecords.length;
  const achievementPercent =
    achievementDenominator > 0
      ? clampPercent((achievementNumerator / achievementDenominator) * 100)
      : 0;

  return {
    scope: {
      type: DASHBOARD_SCOPES.ORGANIZATION,
      id: organizationScope.page_id,
      name: organizationScope.page_name
    },
    period: {
      id: reportingPeriod.id,
      key: reportingPeriod.period_key,
      status: reportingPeriod.status
    },
    summary_cards: [
      {
        code: DASHBOARD_SUMMARY_CARD_CODES.total,
        label: DASHBOARD_SUMMARY_CARD_LABELS.total,
        value: includedRecords.length
      },
      {
        code: DASHBOARD_SUMMARY_CARD_CODES.completed,
        label: DASHBOARD_SUMMARY_CARD_LABELS.completed,
        value: completedCount
      },
      {
        code: DASHBOARD_SUMMARY_CARD_CODES.pending,
        label: DASHBOARD_SUMMARY_CARD_LABELS.pending,
        value: pendingCount
      },
      {
        code: DASHBOARD_SUMMARY_CARD_CODES.overdue,
        label: DASHBOARD_SUMMARY_CARD_LABELS.overdue,
        value: overdueCount
      },
      {
        code: DASHBOARD_SUMMARY_CARD_CODES.atRisk,
        label: DASHBOARD_SUMMARY_CARD_LABELS.atRisk,
        value: atRiskCount
      },
      {
        code: DASHBOARD_SUMMARY_CARD_CODES.achievementPercent,
        label: DASHBOARD_SUMMARY_CARD_LABELS.achievementPercent,
        value: achievementPercent
      }
    ],
    achievement: {
      numerator: achievementNumerator,
      denominator: achievementDenominator,
      percent: achievementPercent
    },
    warnings,
    lineage
  };
}
