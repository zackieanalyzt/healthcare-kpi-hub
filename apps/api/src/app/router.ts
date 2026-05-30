import {
  DASHBOARD_API,
  DASHBOARD_SCOPES,
  PERMISSIONS
} from "@healthcare-kpi-hub/config";
import type { PermissionCode } from "@healthcare-kpi-hub/shared-types";
import { jsonFailure, jsonSuccess } from "../domain/shared/http";
import type { AppContext } from "./types";
import { AppError } from "../domain/shared/errors";
import { createCookie } from "../infrastructure/http/cookies";
import {
  buildAuthCookieBundle,
  buildExpiredAuthCookieBundle,
  loginUser,
  logoutSession
} from "../modules/auth/service";
import { recordAuditEvent } from "../modules/audit/service";
import { getOrganizationDashboardSummary } from "../modules/dashboard/service";
import { getKpiEntryDetail, updateKpiEntry } from "../modules/kpi-entries/service";
import { getKpiPageDetail, getNavigationTree } from "../modules/navigation/service";
import { getWorklist } from "../modules/worklist/service";
import { requireAuthenticated, requirePermission } from "./middleware/rbac";

type RouteParams = Record<string, string>;

type RouteHandler = (
  request: Request,
  context: AppContext,
  params: RouteParams
) => Promise<Response> | Response;

interface RouteDefinition {
  method: string;
  pathname: string;
  auth: "public" | "authenticated";
  permission?: PermissionCode;
  handler: RouteHandler;
}

interface MatchedRoute {
  definition: RouteDefinition;
  params: RouteParams;
}

function parseJsonBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

function parsePagination(url: URL) {
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("page_size") ?? "20");

  return {
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize >= 1 && pageSize <= 100 ? pageSize : 20
  };
}

function attachCookies(response: Response, cookies: string[]): Response {
  const headers = new Headers(response.headers);
  for (const cookie of cookies) {
    headers.append("Set-Cookie", cookie);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function matchPath(pattern: string, pathname: string): RouteParams | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: RouteParams = {};

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];

    if (patternPart.startsWith(":")) {
      const paramName = patternPart.slice(1);
      if (!paramName || !pathPart) {
        return null;
      }

      params[paramName] = decodeURIComponent(pathPart);
      continue;
    }

    if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}

function handleHealth(context: AppContext): Response {
  return jsonSuccess(
    {
      status: "ok",
      service: "api",
      config_loaded: true
    },
    context.requestId
  );
}

function handleReady(context: AppContext): Response {
  const criticalTables = [
    "roles",
    "permissions",
    "users",
    "sessions",
    "workgroups",
    "reporting_periods",
    "kpi_entries"
  ];

  const existing = context.db
    .query(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${criticalTables
        .map(() => "?")
        .join(",")})`
    )
    .all(...criticalTables) as Array<{ name: string }>;

  if (existing.length !== criticalTables.length) {
    throw new AppError("READY_NOT_READY", "Critical tables are not ready.", 503);
  }

  return jsonSuccess(
    {
      status: "ready",
      sqlite_reachable: true,
      migrations_applied: true
    },
    context.requestId
  );
}

async function handleLogin(request: Request, context: AppContext): Promise<Response> {
  const body = await parseJsonBody<{ username?: string; password?: string }>(request);
  const normalizedUsername = body.username?.trim() ?? "";

  if (!normalizedUsername || !body.password) {
    throw new AppError("VALIDATION_FAILED", "Request validation failed.", 400, [
      { field: !normalizedUsername ? "username" : "password", issue: "required" }
    ]);
  }

  try {
    const result = await loginUser(
      context.db,
      context.env,
      context.identityProvider,
      normalizedUsername,
      body.password
    );

    recordAuditEvent(context.db, {
      entityType: "session",
      entityId: result.user.id,
      action: "auth.login.success",
      actorUserId: result.user.id,
      actorUsername: result.user.username,
      payload: {
        provider: context.identityProvider.name
      }
    });

    const response = jsonSuccess(
      {
        user: {
          id: result.user.id,
          username: result.user.username,
          full_name: result.user.full_name,
          role_code: result.user.role_code,
          permissions: result.user.permissions,
          is_active: result.user.is_active
        }
      },
      context.requestId
    );

    const cookies = buildAuthCookieBundle(
      context.env,
      result.sessionToken,
      result.csrfToken
    );

    return attachCookies(response, [
      createCookie(cookies.session),
      createCookie(cookies.csrf)
    ]);
  } catch (error) {
    const appError = error instanceof AppError ? error : null;
    const auditAction =
      appError?.code === "AUTH_INVALID_CREDENTIALS"
        ? "auth.login.failure"
        : appError?.code === "AUTH_ACCOUNT_INACTIVE"
          ? "auth.login.inactive"
          : appError?.code === "AUTH_UPSTREAM_UNAVAILABLE"
            ? "auth.upstream.unavailable"
            : "auth.provider.failure";

    recordAuditEvent(context.db, {
      entityType: "auth_identity",
      entityId: normalizedUsername,
      action: auditAction,
      actorUsername: normalizedUsername,
      payload: {
        provider: context.identityProvider.name,
        error_code: appError?.code ?? "INTERNAL_UNEXPECTED_ERROR"
      }
    });

    throw error;
  }
}

function handleLogout(context: AppContext): Response {
  const authFailure = requireAuthenticated(context);
  if (authFailure) {
    return authFailure;
  }

  logoutSession(context.db, context.session!.id);
  recordAuditEvent(context.db, {
    entityType: "session",
    entityId: context.session!.id,
    action: "auth.logout",
    actorUserId: context.user!.id,
    actorUsername: context.user!.username
  });
  recordAuditEvent(context.db, {
    entityType: "session",
    entityId: context.session!.id,
    action: "auth.session.revoked",
    actorUserId: context.user!.id,
    actorUsername: context.user!.username
  });

  const response = jsonSuccess(
    {
      logged_out: true
    },
    context.requestId
  );

  const cookies = buildExpiredAuthCookieBundle(context.env);

  return attachCookies(response, [
    createCookie(cookies.session),
    createCookie(cookies.csrf)
  ]);
}

function handleMe(context: AppContext): Response {
  const authFailure = requireAuthenticated(context);
  if (authFailure) {
    return authFailure;
  }

  return jsonSuccess(
    {
      user: {
        id: context.user!.id,
        username: context.user!.username,
        full_name: context.user!.full_name,
        role_code: context.user!.role_code,
        permissions: context.user!.permissions,
        is_active: context.user!.is_active,
        last_login_at: context.user!.last_login_at ?? null
      }
    },
    context.requestId
  );
}

function handleNavigation(context: AppContext): Response {
  const authFailure = requirePermission(context, PERMISSIONS.WORKLIST_READ);
  if (authFailure) {
    return authFailure;
  }

  return jsonSuccess(
    {
      workgroups: getNavigationTree(context.db)
    },
    context.requestId
  );
}

function handleAdminWorkgroups(context: AppContext): Response {
  const authFailure = requirePermission(context, PERMISSIONS.ADMIN_NAVIGATION);
  if (authFailure) {
    return authFailure;
  }

  return jsonSuccess(
    {
      workgroups: getNavigationTree(context.db).map((workgroup) => ({
        id: workgroup.id,
        code: workgroup.code,
        name: workgroup.name
      }))
    },
    context.requestId
  );
}

function handleWorklist(request: Request, context: AppContext): Response {
  const authFailure = requirePermission(context, PERMISSIONS.WORKLIST_READ);
  if (authFailure) {
    return authFailure;
  }

  const url = new URL(request.url);
  const { page, pageSize } = parsePagination(url);
  const sortParam = url.searchParams.get("sort") ?? "-updated_at";
  const sort =
    sortParam === "due_at" || sortParam === "-due_at"
      ? "due_at"
      : sortParam === "status" || sortParam === "-status"
        ? "status"
        : "updated_at";
  const mine = (url.searchParams.get("mine") ?? "true") !== "false";
  const result = getWorklist(context.db, {
    periodKey: url.searchParams.get("period_key") ?? undefined,
    page,
    pageSize,
    sort,
    mine,
    currentUsername: context.user?.username ?? null
  });

  return jsonSuccess(
    {
      items: result.items
    },
    context.requestId,
    200,
    {
      pagination: {
        page,
        page_size: pageSize,
        total_items: result.totalItems,
        total_pages: Math.max(1, Math.ceil(result.totalItems / pageSize))
      }
    }
  );
}

function handleDashboardSummary(
  request: Request,
  context: AppContext
): Response {
  const authFailure = requirePermission(context, PERMISSIONS.DASHBOARD_READ);
  if (authFailure) {
    return authFailure;
  }

  const url = new URL(request.url);
  const scope = (url.searchParams.get("scope") ?? DASHBOARD_SCOPES.ORGANIZATION).trim();

  if (scope !== DASHBOARD_SCOPES.ORGANIZATION) {
    throw new AppError("VALIDATION_FAILED", "Request validation failed.", 400, [
      { field: "scope", issue: "unsupported_value" }
    ]);
  }

  return jsonSuccess(
    getOrganizationDashboardSummary(context.db, {
      periodKey: url.searchParams.get("period_key") ?? undefined
    }),
    context.requestId
  );
}

function handleKpiPageDetail(
  context: AppContext,
  params: RouteParams
): Response {
  const authFailure = requirePermission(context, PERMISSIONS.KPI_READ);
  if (authFailure) {
    return authFailure;
  }

  const pageId = params.pageId?.trim() ?? "";
  if (!pageId) {
    throw new AppError("VALIDATION_FAILED", "Request validation failed.", 400, [
      { field: "pageId", issue: "required" }
    ]);
  }

  return jsonSuccess(
    getKpiPageDetail(context.db, pageId, context.user?.username ?? null),
    context.requestId
  );
}

function handleKpiEntryDetail(
  context: AppContext,
  params: RouteParams
): Response {
  const authFailure = requirePermission(context, PERMISSIONS.KPI_READ);
  if (authFailure) {
    return authFailure;
  }

  const entryId = params.entryId?.trim() ?? "";
  if (!entryId) {
    throw new AppError("VALIDATION_FAILED", "Request validation failed.", 400, [
      { field: "entryId", issue: "required" }
    ]);
  }

  return jsonSuccess(
    getKpiEntryDetail(context.db, entryId, context.user?.username ?? null),
    context.requestId
  );
}

async function handleKpiEntryPatch(
  request: Request,
  context: AppContext,
  params: RouteParams
): Promise<Response> {
  const authFailure = requirePermission(context, PERMISSIONS.KPI_UPDATE);
  if (authFailure) {
    return authFailure;
  }

  const entryId = params.entryId?.trim() ?? "";
  if (!entryId) {
    throw new AppError("VALIDATION_FAILED", "Request validation failed.", 400, [
      { field: "entryId", issue: "required" }
    ]);
  }

  const body = await parseJsonBody<unknown>(request);

  return jsonSuccess(
    updateKpiEntry(context.db, entryId, body, {
      userId: context.user!.id,
      username: context.user!.username
    }),
    context.requestId
  );
}

export function createRouter(): RouteDefinition[] {
  return [
    {
      method: "GET",
      pathname: "/healthz",
      auth: "public",
      handler: (_request, context) => handleHealth(context)
    },
    {
      method: "GET",
      pathname: "/readyz",
      auth: "public",
      handler: (_request, context) => handleReady(context)
    },
    {
      method: "POST",
      pathname: "/api/auth/login",
      auth: "public",
      handler: handleLogin
    },
    {
      method: "POST",
      pathname: "/api/auth/logout",
      auth: "authenticated",
      handler: (_request, context) => handleLogout(context)
    },
    {
      method: "GET",
      pathname: "/api/me",
      auth: "authenticated",
      handler: (_request, context) => handleMe(context)
    },
    {
      method: "GET",
      pathname: "/api/navigation",
      auth: "authenticated",
      permission: PERMISSIONS.WORKLIST_READ,
      handler: (_request, context) => handleNavigation(context)
    },
    {
      method: "GET",
      pathname: "/api/admin/navigation/workgroups",
      auth: "authenticated",
      permission: PERMISSIONS.ADMIN_NAVIGATION,
      handler: (_request, context) => handleAdminWorkgroups(context)
    },
    {
      method: "GET",
      pathname: "/api/worklist",
      auth: "authenticated",
      permission: PERMISSIONS.WORKLIST_READ,
      handler: (request, context) => handleWorklist(request, context)
    },
    {
      method: "GET",
      pathname: DASHBOARD_API.summaryPath,
      auth: "authenticated",
      permission: PERMISSIONS.DASHBOARD_READ,
      handler: (request, context) => handleDashboardSummary(request, context)
    },
    {
      method: "GET",
      pathname: "/api/kpi-pages/:pageId",
      auth: "authenticated",
      permission: PERMISSIONS.KPI_READ,
      handler: (_request, context, params) => handleKpiPageDetail(context, params)
    },
    {
      method: "GET",
      pathname: "/api/kpi-entries/:entryId",
      auth: "authenticated",
      permission: PERMISSIONS.KPI_READ,
      handler: (_request, context, params) => handleKpiEntryDetail(context, params)
    },
    {
      method: "PATCH",
      pathname: "/api/kpi-entries/:entryId",
      auth: "authenticated",
      permission: PERMISSIONS.KPI_UPDATE,
      handler: (request, context, params) => handleKpiEntryPatch(request, context, params)
    }
  ];
}

function findRoute(request: Request, pathname: string): MatchedRoute | null {
  for (const route of createRouter()) {
    if (route.method !== request.method) {
      continue;
    }

    const params = matchPath(route.pathname, pathname);
    if (params) {
      return {
        definition: route,
        params
      };
    }
  }

  return null;
}

export async function dispatchRoute(
  request: Request,
  pathname: string,
  context: AppContext
): Promise<Response> {
  const match = findRoute(request, pathname);

  if (!match) {
    return jsonFailure(
      {
        code: "NOT_FOUND_ROUTE",
        message: "Route not found."
      },
      context.requestId,
      404
    );
  }

  if (match.definition.auth === "authenticated") {
    const authFailure = requireAuthenticated(context);
    if (authFailure) {
      return authFailure;
    }
  }

  if (match.definition.permission) {
    const permissionFailure = requirePermission(context, match.definition.permission);
    if (permissionFailure) {
      return permissionFailure;
    }
  }

  return match.definition.handler(request, context, match.params);
}
