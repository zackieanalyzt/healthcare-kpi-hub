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
