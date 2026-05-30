import type {
  DashboardAchievementStatus,
  DashboardAggregationMethod,
  DashboardLineageFieldName,
  DashboardMeasurementType,
  DashboardRiskStatus,
  DashboardSummaryCardCode,
  DashboardTargetDirection,
  DashboardTargetOperator,
  DashboardWarningCode,
  PermissionCode,
  RoleCode
} from "@healthcare-kpi-hub/shared-types";

export const ROLE_CODES: RoleCode[] = ["admin", "manager", "editor", "viewer"];

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  EDITOR: "editor",
  VIEWER: "viewer"
} as const satisfies Record<string, RoleCode>;

export const PERMISSION_CODES: PermissionCode[] = [
  "worklist.read",
  "kpi.read",
  "kpi.update",
  "kpi.import",
  "dashboard.read",
  "admin.navigation",
  "admin.kpi_definition",
  "admin.users",
  "audit.read"
];

export const PERMISSIONS = {
  WORKLIST_READ: "worklist.read",
  KPI_READ: "kpi.read",
  KPI_UPDATE: "kpi.update",
  KPI_IMPORT: "kpi.import",
  DASHBOARD_READ: "dashboard.read",
  ADMIN_NAVIGATION: "admin.navigation",
  ADMIN_KPI_DEFINITION: "admin.kpi_definition",
  ADMIN_USERS: "admin.users",
  AUDIT_READ: "audit.read"
} as const satisfies Record<string, PermissionCode>;

export const DEFAULT_ROLE: RoleCode = "viewer";

export const DEFAULT_API_PORT = 3000;
export const DEFAULT_WEB_PORT = 5173;
export const DEFAULT_LOG_LEVEL = "INFO";
export const DEFAULT_DEV_AUTH_PASSWORD = "dev-password";

export const DASHBOARD_RELEASE = {
  version: "phase-1a",
  releaseDate: "2026-05-30",
  releaseLabel: "phase-1a-kickoff",
  phaseLabel: "Phase 1A"
} as const;

export const DASHBOARD_API = {
  summaryPath: "/api/dashboard/summary"
} as const;

export const DASHBOARD_SCOPES = {
  ORGANIZATION: "organization"
} as const;

export const DASHBOARD_REPORTING_PERIOD_STATUSES = {
  OPEN: "open"
} as const;

export const DASHBOARD_MEASUREMENT_TYPES = {
  firstPass: ["percentage", "count", "milestone", "boolean"],
  deferred: ["ratio", "score", "currency", "duration", "custom"]
} as const satisfies {
  firstPass: DashboardMeasurementType[];
  deferred: DashboardMeasurementType[];
};

export const DASHBOARD_MEASUREMENT_TYPE = {
  PERCENTAGE: "percentage",
  COUNT: "count",
  MILESTONE: "milestone",
  BOOLEAN: "boolean",
  RATIO: "ratio",
  SCORE: "score",
  CURRENCY: "currency",
  DURATION: "duration",
  CUSTOM: "custom"
} as const satisfies Record<string, DashboardMeasurementType>;

export const DASHBOARD_TARGET_OPERATORS: DashboardTargetOperator[] = [
  ">=",
  ">",
  "<=",
  "<",
  "=",
  "between",
  "milestone_at_least",
  "milestone_exact"
];

export const DASHBOARD_TARGET_OPERATOR = {
  GTE: ">=",
  GT: ">",
  LTE: "<=",
  LT: "<",
  EQ: "=",
  BETWEEN: "between",
  MILESTONE_AT_LEAST: "milestone_at_least",
  MILESTONE_EXACT: "milestone_exact"
} as const satisfies Record<string, DashboardTargetOperator>;

export const DASHBOARD_TARGET_DIRECTIONS: DashboardTargetDirection[] = [
  "higher_is_better",
  "lower_is_better",
  "range_is_better",
  "milestone_progression",
  "boolean_true"
];

export const DASHBOARD_TARGET_DIRECTION = {
  HIGHER_IS_BETTER: "higher_is_better",
  LOWER_IS_BETTER: "lower_is_better",
  RANGE_IS_BETTER: "range_is_better",
  MILESTONE_PROGRESSION: "milestone_progression",
  BOOLEAN_TRUE: "boolean_true"
} as const satisfies Record<string, DashboardTargetDirection>;

export const DASHBOARD_AGGREGATION_METHODS: DashboardAggregationMethod[] = [
  "latest_value",
  "sum",
  "ratio_sum",
  "average",
  "latest_level",
  "count_at_or_above_target",
  "pass_rate"
];

export const DASHBOARD_AGGREGATION_METHOD = {
  LATEST_VALUE: "latest_value",
  SUM: "sum",
  RATIO_SUM: "ratio_sum",
  AVERAGE: "average",
  LATEST_LEVEL: "latest_level",
  COUNT_AT_OR_ABOVE_TARGET: "count_at_or_above_target",
  PASS_RATE: "pass_rate"
} as const satisfies Record<string, DashboardAggregationMethod>;

export const DASHBOARD_ACHIEVEMENT_STATUSES: DashboardAchievementStatus[] = [
  "not_started",
  "in_progress",
  "achieved",
  "not_achieved",
  "not_configured",
  "not_applicable"
];

export const DASHBOARD_ACHIEVEMENT_STATUS = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  ACHIEVED: "achieved",
  NOT_ACHIEVED: "not_achieved",
  NOT_CONFIGURED: "not_configured",
  NOT_APPLICABLE: "not_applicable"
} as const satisfies Record<string, DashboardAchievementStatus>;

export const DASHBOARD_RISK_STATUSES: DashboardRiskStatus[] = [
  "not_configured",
  "on_track",
  "watch",
  "at_risk",
  "critical",
  "not_applicable"
];

export const DASHBOARD_RISK_STATUS = {
  NOT_CONFIGURED: "not_configured",
  ON_TRACK: "on_track",
  WATCH: "watch",
  AT_RISK: "at_risk",
  CRITICAL: "critical",
  NOT_APPLICABLE: "not_applicable"
} as const satisfies Record<string, DashboardRiskStatus>;

export const DASHBOARD_STATUS_RULES = {
  workflowStatusMap: {
    draft: "draft",
    pending: "active",
    submitted: "submitted",
    reviewed: "reviewed",
    approved: "approved",
    completed: "completed",
    overdue: "overdue",
    cancelled: "cancelled",
    archived: "archived",
    locked: "completed"
  },
  denominatorIncluded: [
    "active",
    "submitted",
    "reviewed",
    "approved",
    "completed",
    "overdue"
  ],
  denominatorExcluded: ["draft", "cancelled", "archived"],
  overdueSourceStatuses: ["active", "submitted", "reviewed", "approved"],
  completedStatuses: ["approved", "completed"],
  pendingStatuses: ["active", "submitted", "reviewed"],
  atRiskStatuses: ["at_risk", "critical"]
} as const;

export const DASHBOARD_RUNTIME_RULES = {
  staleProgressMaxAgeDays: 14,
  allowExplicitOverdueStatus: true
} as const;

export const DASHBOARD_BOOLEAN_VALUE_LABELS = {
  trueValues: ["true", "1", "yes", "y"],
  falseValues: ["false", "0", "no", "n"]
} as const;

export const DASHBOARD_WARNING_CODES: DashboardWarningCode[] = [
  "missing_measurement_type",
  "missing_target_rule",
  "missing_threshold_rules",
  "missing_milestone_levels",
  "invalid_aggregation_method",
  "ambiguous_scope",
  "stale_progress_data"
];

export const DASHBOARD_WARNING_CODE = {
  MISSING_MEASUREMENT_TYPE: "missing_measurement_type",
  MISSING_TARGET_RULE: "missing_target_rule",
  MISSING_THRESHOLD_RULES: "missing_threshold_rules",
  MISSING_MILESTONE_LEVELS: "missing_milestone_levels",
  INVALID_AGGREGATION_METHOD: "invalid_aggregation_method",
  AMBIGUOUS_SCOPE: "ambiguous_scope",
  STALE_PROGRESS_DATA: "stale_progress_data"
} as const satisfies Record<string, DashboardWarningCode>;

export const DASHBOARD_LINEAGE_FIELD_NAMES: DashboardLineageFieldName[] = [
  "kpi_definition_id",
  "assignment_id",
  "scope_type",
  "scope_id",
  "measurement_metadata_version_or_updated_at",
  "calculation_timestamp",
  "source_entry_updated_at"
];

export const DASHBOARD_METADATA_VALIDATION = {
  requiredTargetRuleFields: [
    "measurement_type",
    "target_operator",
    "target_value",
    "target_direction"
  ],
  milestoneRequiresLevels: true,
  thresholdRulesOptional: true
} as const;

export const DASHBOARD_THRESHOLD_RULE_SCHEMA = {
  ruleCollectionKey: "bands",
  allowedStatuses: ["on_track", "watch", "at_risk", "critical"]
} as const;

export const DASHBOARD_MILESTONE_RULE_SCHEMA = {
  levelsKey: "levels",
  minimumLevelCount: 1
} as const;

export const DASHBOARD_SUMMARY_CARD_LABELS = {
  total: "Total KPIs",
  completed: "Completed",
  pending: "Pending",
  overdue: "Overdue",
  atRisk: "At Risk",
  achievementPercent: "Achievement %"
} as const;

export const DASHBOARD_SUMMARY_CARD_CODES = {
  total: "total_kpis",
  completed: "completed_kpis",
  pending: "pending_kpis",
  overdue: "overdue_kpis",
  atRisk: "at_risk_kpis",
  achievementPercent: "achievement_rate"
} as const satisfies Record<string, DashboardSummaryCardCode>;

export const DASHBOARD_WARNING_MESSAGES: Record<DashboardWarningCode, string> = {
  missing_measurement_type: "KPI measurement type is missing.",
  missing_target_rule: "KPI target rule metadata is missing.",
  missing_threshold_rules: "KPI threshold rules are missing.",
  missing_milestone_levels: "KPI milestone levels are missing.",
  invalid_aggregation_method: "KPI aggregation method is invalid for the configured measurement type.",
  ambiguous_scope: "KPI scope ownership is ambiguous and cannot be rolled up safely.",
  stale_progress_data: "KPI progress data appears stale."
};

export const DASHBOARD_ALLOWED_AGGREGATION_METHODS_BY_MEASUREMENT_TYPE: Record<
  DashboardMeasurementType,
  DashboardAggregationMethod[]
> = {
  percentage: ["latest_value", "ratio_sum", "average"],
  count: ["latest_value", "sum"],
  milestone: ["latest_level", "count_at_or_above_target"],
  boolean: ["latest_value", "pass_rate"],
  ratio: ["ratio_sum", "average"],
  score: ["latest_value", "average"],
  currency: ["latest_value", "sum", "average"],
  duration: ["latest_value", "average"],
  custom: ["latest_value"]
};
