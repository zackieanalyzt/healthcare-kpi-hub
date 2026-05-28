import type { AppContext } from "../../app/types";
import type { AppLogger } from "./logger";

export function createRequestLogger(logger: AppLogger) {
  return {
    onRequest(request: Request, context: AppContext): number {
      const startedAt = performance.now();
      logger.info("request.started", {
        request_id: context.requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        actor_username: context.user?.username ?? null
      });
      return startedAt;
    },
    onResponse(
      request: Request,
      response: Response,
      context: AppContext,
      startedAt: number
    ) {
      logger.info("request.completed", {
        request_id: context.requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        status_code: response.status,
        duration_ms: Math.round(performance.now() - startedAt)
      });
    }
  };
}
