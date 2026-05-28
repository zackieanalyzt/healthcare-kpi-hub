export function generateSessionToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}
