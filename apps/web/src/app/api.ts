import type {
  ApiResponse,
  AuthenticatedUser,
  DashboardOrganizationSummary,
  KpiEntryMutationRequest,
  KpiEntryDetail,
  KpiPageDetail,
  NavigationWorkgroup,
  WorklistItem
} from "@healthcare-kpi-hub/shared-types";
import { DASHBOARD_API, DASHBOARD_SCOPES } from "@healthcare-kpi-hub/config";

async function requestJson<T>(input: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  return response.json() as Promise<ApiResponse<T>>;
}

function readCsrfTokenFromCookie(): string | null {
  const entry = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("healthcare_kpi_hub_csrf="));

  if (!entry) {
    return null;
  }

  return decodeURIComponent(entry.split("=").slice(1).join("="));
}

export async function login(username: string, password: string) {
  return requestJson<{ user: AuthenticatedUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function logout() {
  return requestJson<{ logged_out: boolean }>("/api/auth/logout", {
    method: "POST",
    headers: {
      "X-CSRF-Token": readCsrfTokenFromCookie() ?? ""
    },
    body: JSON.stringify({})
  });
}

export async function fetchCurrentUser() {
  return requestJson<{ user: AuthenticatedUser }>("/api/me");
}

export async function fetchNavigation() {
  return requestJson<{ workgroups: NavigationWorkgroup[] }>("/api/navigation");
}

export async function fetchWorklist() {
  return requestJson<{ items: WorklistItem[] }>("/api/worklist");
}

export async function fetchOrganizationDashboardSummary() {
  const params = new URLSearchParams({
    scope: DASHBOARD_SCOPES.ORGANIZATION
  });

  return requestJson<DashboardOrganizationSummary>(
    `${DASHBOARD_API.summaryPath}?${params.toString()}`
  );
}

export async function fetchKpiPage(pageId: string) {
  return requestJson<KpiPageDetail>(`/api/kpi-pages/${encodeURIComponent(pageId)}`);
}

export async function fetchKpiEntry(entryId: string) {
  return requestJson<KpiEntryDetail>(`/api/kpi-entries/${encodeURIComponent(entryId)}`);
}

export async function updateKpiEntry(
  entryId: string,
  payload: KpiEntryMutationRequest
) {
  return requestJson<KpiEntryDetail>(`/api/kpi-entries/${encodeURIComponent(entryId)}`, {
    method: "PATCH",
    headers: {
      "X-CSRF-Token": readCsrfTokenFromCookie() ?? ""
    },
    body: JSON.stringify(payload)
  });
}
