import type { ApiFailure, ApiSuccess } from "@healthcare-kpi-hub/shared-types";

function baseMeta(requestId: string, extra?: Record<string, unknown>) {
  return {
    request_id: requestId,
    timestamp: new Date().toISOString(),
    ...(extra ?? {})
  };
}

export function jsonSuccess<T>(
  data: T,
  requestId: string,
  status = 200,
  meta?: Record<string, unknown>
): Response {
  const body: ApiSuccess<T> = {
    success: true,
    data,
    meta: baseMeta(requestId, meta)
  };

  return Response.json(body, { status });
}

export function jsonFailure(
  error: ApiFailure["error"],
  requestId: string,
  status: number,
  meta?: Record<string, unknown>
): Response {
  const body: ApiFailure = {
    success: false,
    error,
    meta: baseMeta(requestId, meta)
  };

  return Response.json(body, { status });
}
