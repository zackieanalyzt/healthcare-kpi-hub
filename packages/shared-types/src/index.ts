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
