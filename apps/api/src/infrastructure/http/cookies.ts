export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

export function createCookie(options: {
  name: string;
  value: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  path?: string;
  maxAgeSeconds?: number;
}): string {
  const parts = [`${options.name}=${encodeURIComponent(options.value)}`];

  parts.push(`Path=${options.path ?? "/"}`);
  if (typeof options.maxAgeSeconds === "number") {
    parts.push(`Max-Age=${options.maxAgeSeconds}`);
  }
  if (options.httpOnly) {
    parts.push("HttpOnly");
  }
  if (options.secure) {
    parts.push("Secure");
  }
  parts.push(`SameSite=${options.sameSite ?? "Lax"}`);

  return parts.join("; ");
}
