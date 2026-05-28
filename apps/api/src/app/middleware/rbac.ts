import type { PermissionCode } from "@healthcare-kpi-hub/shared-types";
import type { AppContext } from "../types";
import { jsonFailure } from "../../domain/shared/http";

export function requireAuthenticated(context: AppContext): Response | null {
  if (!context.user || !context.session) {
    return jsonFailure(
      {
        code: "AUTH_UNAUTHENTICATED",
        message: "Authentication is required."
      },
      context.requestId,
      401
    );
  }

  return null;
}

export function requirePermission(
  context: AppContext,
  permission: PermissionCode
): Response | null {
  const authFailure = requireAuthenticated(context);
  if (authFailure) {
    return authFailure;
  }

  const user = context.user;
  if (!user) {
    return jsonFailure(
      {
        code: "AUTH_UNAUTHENTICATED",
        message: "Authentication is required."
      },
      context.requestId,
      401
    );
  }

  if (!user.permissions.includes(permission)) {
    return jsonFailure(
      {
        code: "AUTH_FORBIDDEN",
        message: "You do not have permission to perform this action."
      },
      context.requestId,
      403
    );
  }

  return null;
}
