import type { PermissionCode, RoleCode } from "@healthcare-kpi-hub/shared-types";

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
