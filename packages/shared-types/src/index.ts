export type RoleCode = "admin" | "manager" | "editor" | "viewer";

export type PermissionCode =
  | "worklist.read"
  | "kpi.read"
  | "kpi.update"
  | "kpi.import"
  | "dashboard.read"
  | "admin.navigation"
  | "admin.kpi_definition"
  | "admin.users"
  | "audit.read";

export type HierarchyLevelCode =
  | "organization"
  | "department"
  | "unit"
  | "individual";

export interface ApiMeta {
  request_id: string;
  timestamp: string;
  pagination?: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  field: string;
  issue: string;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface AuthenticatedUser {
  id: string;
  username: string;
  full_name: string | null;
  role_code: RoleCode;
  permissions: PermissionCode[];
  is_active: boolean;
  last_login_at?: string | null;
}

export interface NavigationPage {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface NavigationSection {
  id: string;
  code: string;
  name: string;
  pages: NavigationPage[];
}

export interface NavigationWorkgroup {
  id: string;
  code: string;
  name: string;
  sections: NavigationSection[];
}

export interface WorklistItem {
  entry_id: string;
  kpi_definition_id: string;
  kpi_code: string;
  kpi_name: string;
  page_id: string;
  page_name: string;
  workgroup_name: string;
  section_name: string;
  reporting_period_key: string;
  status: string;
  assigned_to: string | null;
  due_at: string | null;
  updated_at: string;
  editable: boolean;
}

export interface KpiPageHierarchyNode {
  page_id: string;
  code: string;
  name: string;
  hierarchy_level: HierarchyLevelCode;
  owner_label: string | null;
  owner_user: {
    id: string;
    username: string;
    full_name: string | null;
  } | null;
}

export interface KpiPageSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  section: {
    id: string;
    code: string;
    name: string;
  };
  workgroup: {
    id: string;
    code: string;
    name: string;
  };
}

export interface KpiPageCurrentPeriod {
  id: string;
  period_key: string;
  status: string;
  starts_at: string;
  ends_at: string;
}

export interface KpiPageAssignedKpiItem {
  definition: {
    id: string;
    code: string;
    name: string;
    unit: string | null;
    value_type: string;
    preset_code: string;
    owner_label: string | null;
  };
  assignment: {
    entry_id: string | null;
    status: string | null;
    assigned_to: string | null;
    due_at: string | null;
    updated_at: string | null;
    updated_by: string | null;
    editable: boolean;
  };
  value: {
    target_value: string | null;
    actual_value: string | null;
    progress_value: number | null;
    note: string | null;
    extra_json: string | null;
  };
}

export interface KpiPageDetail {
  page: KpiPageSummary;
  hierarchy: {
    current_node: KpiPageHierarchyNode;
    parent_node: KpiPageHierarchyNode | null;
    child_nodes: KpiPageHierarchyNode[];
  };
  current_period: KpiPageCurrentPeriod | null;
  assigned_kpis: KpiPageAssignedKpiItem[];
}

export interface KpiDefinitionSummary {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  value_type: string;
  preset_code: string;
  owner_label: string | null;
}

export interface EntryValuePayload {
  target_value: string | null;
  actual_value: string | null;
  progress_value: number | null;
  note: string | null;
  extra_json: string | null;
}

export interface ReportingPeriodSummary {
  id: string;
  period_key: string;
  period_type: string;
  status: string;
  starts_at: string;
  ends_at: string;
}

export interface AuditHistoryItem {
  audit_event_id: string;
  action: string;
  actor_username: string | null;
  occurred_at: string;
  summary: string | null;
  changed_fields?: string[] | null;
  old_summary?: Record<string, unknown> | null;
  new_summary?: Record<string, unknown> | null;
}

export interface KpiEntrySummary {
  id: string;
  status: string;
  assigned_to: string | null;
  due_at: string | null;
  updated_at: string;
  updated_by: string | null;
  editable: boolean;
}

export interface KpiEntryDetail {
  entry: KpiEntrySummary;
  definition: KpiDefinitionSummary;
  value: EntryValuePayload;
  reporting_period: ReportingPeriodSummary;
  page: KpiPageSummary;
  hierarchy: {
    current_node: KpiPageHierarchyNode;
    parent_node: KpiPageHierarchyNode | null;
    child_nodes: KpiPageHierarchyNode[];
  };
  history: AuditHistoryItem[];
}

export interface KpiEntryMutationValueInput {
  actual_value?: string;
  progress_value?: number;
  note?: string;
}

export interface KpiEntryMutationRequest {
  updated_at: string;
  status?: string;
  value?: KpiEntryMutationValueInput;
}

export type DashboardMeasurementType =
  | "percentage"
  | "count"
  | "milestone"
  | "boolean"
  | "ratio"
  | "score"
  | "currency"
  | "duration"
  | "custom";

export type DashboardTargetOperator =
  | ">="
  | ">"
  | "<="
  | "<"
  | "="
  | "between"
  | "milestone_at_least"
  | "milestone_exact";

export type DashboardTargetDirection =
  | "higher_is_better"
  | "lower_is_better"
  | "range_is_better"
  | "milestone_progression"
  | "boolean_true";

export type DashboardAggregationMethod =
  | "latest_value"
  | "sum"
  | "ratio_sum"
  | "average"
  | "latest_level"
  | "count_at_or_above_target"
  | "pass_rate";

export type DashboardAchievementStatus =
  | "not_started"
  | "in_progress"
  | "achieved"
  | "not_achieved"
  | "not_configured"
  | "not_applicable";

export type DashboardRiskStatus =
  | "not_configured"
  | "on_track"
  | "watch"
  | "at_risk"
  | "critical"
  | "not_applicable";

export type DashboardWarningCode =
  | "missing_measurement_type"
  | "missing_target_rule"
  | "missing_threshold_rules"
  | "missing_milestone_levels"
  | "invalid_aggregation_method"
  | "ambiguous_scope"
  | "stale_progress_data";

export type DashboardLineageFieldName =
  | "kpi_definition_id"
  | "assignment_id"
  | "scope_type"
  | "scope_id"
  | "measurement_metadata_version_or_updated_at"
  | "calculation_timestamp"
  | "source_entry_updated_at";

export interface DashboardDataQualityWarning {
  code: DashboardWarningCode;
  message: string;
  kpi_definition_id: string | null;
  kpi_entry_id: string | null;
}

export interface DashboardLineageRecord {
  kpi_definition_id: string;
  assignment_id: string;
  scope_type: string;
  scope_id: string;
  measurement_metadata_version_or_updated_at: string | null;
  calculation_timestamp: string;
  source_entry_updated_at: string | null;
}

export interface DashboardSummaryCard {
  code: string;
  label: string;
  value: number;
}

export interface DashboardOrganizationSummary {
  scope: {
    type: "organization";
    id: string;
    name: string;
  };
  period: {
    id: string;
    key: string;
    status: string;
  };
  summary_cards: DashboardSummaryCard[];
  achievement: {
    numerator: number;
    denominator: number;
    percent: number;
  };
  warnings: DashboardDataQualityWarning[];
  lineage: DashboardLineageRecord[];
}
