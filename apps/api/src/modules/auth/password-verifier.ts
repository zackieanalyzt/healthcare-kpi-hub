import { createHash, timingSafeEqual } from "node:crypto";
import type { MariaDbPasswordHashMode } from "../../infrastructure/config/env";
import { AppError } from "../../domain/shared/errors";

export async function verifyMariaDbPassword(
  mode: MariaDbPasswordHashMode,
  password: string,
  storedValue: string
): Promise<boolean> {
  switch (mode) {
    case "bun-password":
    case "bcrypt":
      return verifyBunPassword(password, storedValue);
    case "plaintext":
      return timingSafeStringEqual(password, storedValue);
    case "md5":
      assertHexDigest(storedValue, 32);
      return timingSafeStringEqual(createHash("md5").update(password).digest("hex"), storedValue);
    case "sha1":
      assertHexDigest(storedValue, 40);
      return timingSafeStringEqual(
        createHash("sha1").update(password).digest("hex"),
        storedValue
      );
    default:
      throw new AppError(
        "AUTH_PROVIDER_FAILURE",
        "Authentication provider returned an invalid response.",
        503
      );
  }
}

async function verifyBunPassword(password: string, storedValue: string): Promise<boolean> {
  try {
    return await Bun.password.verify(password, storedValue);
  } catch {
    throw new AppError(
      "AUTH_PROVIDER_FAILURE",
      "Authentication provider returned an invalid response.",
      503
    );
  }
}

function timingSafeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function assertHexDigest(value: string, expectedLength: number): void {
  if (value.length !== expectedLength || !/^[a-f0-9]+$/.test(value)) {
    throw new AppError(
      "AUTH_PROVIDER_FAILURE",
      "Authentication provider returned an invalid response.",
      503
    );
  }
}
