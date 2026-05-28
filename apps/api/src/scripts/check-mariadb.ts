import { isAppError } from "../domain/shared/errors";
import { loadEnv } from "../infrastructure/config/env";
import {
  checkMariaDbConnectivity,
  checkMariaDbIdentityLookup,
  checkMariaDbPasswordModeProbe,
  checkMariaDbSmokeUser,
  createMariaDbQueryClient
} from "../modules/auth/provider";

let client: ReturnType<typeof createMariaDbQueryClient> | null = null;

try {
  const env = loadEnv();
  if (env.authProvider !== "mariadb") {
    throw new Error("AUTH_PROVIDER must be mariadb for auth:check-mariadb.");
  }

  client = createMariaDbQueryClient(env);
  const report = await checkMariaDbConnectivity(env, client);
  const smokeUsername = Bun.env.SMOKE_LOGIN_USERNAME?.trim() ?? "";
  const smokePassword = Bun.env.SMOKE_LOGIN_PASSWORD ?? "";
  const smokeUserCheck =
    smokeUsername.length > 0
      ? await checkMariaDbSmokeUser(env, client, smokeUsername)
      : null;
  const identityLookupCheck =
    smokeUsername.length > 0
      ? await checkMariaDbIdentityLookup(env, client, smokeUsername)
      : null;
  const passwordModeProbe =
    smokeUsername.length > 0 && smokePassword.length > 0
      ? await checkMariaDbPasswordModeProbe(env, client, smokeUsername, smokePassword)
      : null;

  console.log(
    JSON.stringify(
      {
        success: true,
        connection: report.connection,
        table_found: report.tableFound,
        required_columns_found: report.requiredColumnsFound,
        username_column_type: report.usernameColumnType,
        integer_username_supported: report.integerUsernameSupported,
        hash_mode: report.hashMode,
        active_column_present: report.activeColumnPresent,
        available_columns: report.availableColumns,
        smoke_username: smokeUsername ? maskUsername(smokeUsername) : null,
        smoke_user_found: smokeUserCheck?.smokeUserFound ?? null,
        smoke_user_matching_rows: smokeUserCheck?.matchingRows ?? null,
        smoke_password_present: smokeUserCheck?.passwordPresent ?? null,
        smoke_name_data_present: smokeUserCheck?.nameDataPresent ?? null,
        smoke_identity_lookup_row_found: identityLookupCheck?.rowFound ?? null,
        smoke_identity_lookup_password_present:
          identityLookupCheck?.passwordPresent ?? null,
        smoke_identity_lookup_name_data_present:
          identityLookupCheck?.nameDataPresent ?? null,
        smoke_md5_match: passwordModeProbe?.md5Match ?? null
      },
      null,
      2
    )
  );

  if (!report.tableFound || !report.requiredColumnsFound) {
    process.exit(1);
  }
} catch (error) {
  console.log(
    JSON.stringify(
      {
        success: false,
        connection: "fail",
        error_code: isAppError(error) ? error.code : "AUTH_CONFIGURATION_INVALID",
        message:
          error instanceof Error
            ? error.message
            : "Authentication upstream is unavailable."
      },
      null,
      2
    )
  );
  process.exit(1);
} finally {
  if (client?.close) {
    await client.close();
  }
}

function maskUsername(username: string): string {
  if (/^\d+$/.test(username)) {
    if (username.length <= 2) {
      return `${username[0] ?? "*"}*`;
    }

    return `${username.slice(0, 2)}${"*".repeat(Math.max(3, username.length - 3))}${username.slice(-1)}`;
  }

  const visible = username.slice(0, Math.min(2, username.length));
  const trailing = username.length > 2 ? username.slice(-1) : "";
  return `${visible}${"*".repeat(Math.max(3, username.length - visible.length - trailing.length))}${trailing}`;
}
