import { timingSafeEqual } from "node:crypto";
import { AppError } from "../../domain/shared/errors";
import { parseCookies } from "../../infrastructure/http/cookies";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function assertCsrfForMutation(
  request: Request,
  headerName: string,
  cookieName: string
): void {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return;
  }

  if (new URL(request.url).pathname === "/api/auth/login") {
    return;
  }

  const headerValue = request.headers.get(headerName);
  const cookieValue = parseCookies(request.headers.get("cookie"))[cookieName];

  if (!headerValue || !cookieValue) {
    throw new AppError(
      "AUTH_CSRF_REQUIRED",
      "A CSRF token is required for mutation requests.",
      403
    );
  }

  const headerBuffer = Buffer.from(headerValue);
  const cookieBuffer = Buffer.from(cookieValue);
  if (
    headerBuffer.length !== cookieBuffer.length ||
    !timingSafeEqual(headerBuffer, cookieBuffer)
  ) {
    throw new AppError(
      "AUTH_CSRF_INVALID",
      "The CSRF token is invalid.",
      403
    );
  }
}
