import { dispatchRoute } from "./router";
import type { AppContext, AppDependencies } from "./types";
import { createRequestLogger } from "../infrastructure/logging/request-logger";
import { createRequestId } from "../app/middleware/request-id";
import { resolveSessionUser } from "../app/middleware/auth";
import { assertCsrfForMutation } from "./middleware/csrf";
import { applySecurityHeaders } from "./middleware/security";
import { isAppError } from "../domain/shared/errors";
import { jsonFailure } from "../domain/shared/http";

export function createApiServer(dependencies: AppDependencies): Bun.Server<undefined> {
  const handler = createRequestHandler(dependencies);
  return Bun.serve({
    port: dependencies.env.apiPort,
    development: dependencies.env.nodeEnv !== "production",
    fetch: handler
  });
}

export function createRequestHandler(dependencies: AppDependencies) {
  const requestLogger = createRequestLogger(dependencies.logger);

  return async (request: Request) => {
      const url = new URL(request.url);
      const requestId = createRequestId();
      const resolvedAuth = await resolveSessionUser(request, dependencies);

      const context: AppContext = {
        requestId,
        logger: dependencies.logger,
        env: dependencies.env,
        db: dependencies.db,
        identityProvider: dependencies.identityProvider,
        user: resolvedAuth.user,
        session: resolvedAuth.session
      };

      const startedAt = requestLogger.onRequest(request, context);

      try {
        assertCsrfForMutation(
          request,
          context.env.csrfHeaderName,
          context.env.csrfCookieName
        );

        const response = await dispatchRoute(request, url.pathname, context);
        const securedResponse = applySecurityHeaders(response);

        requestLogger.onResponse(request, securedResponse, context, startedAt);
        return securedResponse;
      } catch (error) {
        const response = isAppError(error)
          ? jsonFailure(
              {
                code: error.code,
                message: error.message,
                details: error.details
              },
              context.requestId,
              error.status
            )
          : jsonFailure(
              {
                code: "INTERNAL_UNEXPECTED_ERROR",
                message: "An unexpected error occurred."
              },
              context.requestId,
              500
            );

        context.logger.error("request.failed", {
          request_id: context.requestId,
          path: url.pathname,
          method: request.method,
          category: isAppError(error) && error.code.startsWith("AUTH")
            ? "AUTH"
            : "INTERNAL",
          actor_username: context.user?.username ?? null,
          error_code: isAppError(error) ? error.code : "INTERNAL_UNEXPECTED_ERROR"
        });

        const securedResponse = applySecurityHeaders(response);
        requestLogger.onResponse(request, securedResponse, context, startedAt);
        return securedResponse;
      }
    };
}
