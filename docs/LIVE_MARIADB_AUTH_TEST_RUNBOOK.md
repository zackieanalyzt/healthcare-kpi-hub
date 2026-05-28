# Live MariaDB Auth Test Runbook

## Purpose

This runbook verifies the live MariaDB login path for `healthcare-kpi-hub` without exposing credentials, session tokens, or password hashes in logs or documentation.

## Prerequisites

- Bun dependencies installed.
- SQLite migrations and seeds already applied to the local application database.
- A reachable MariaDB instance with the real authentication table and columns.
- A test account approved for validation against the live MariaDB source.
- A local shell session where secrets can be exported as environment variables without committing them to the repository.

## Required Environment Variables

- `NODE_ENV=development`
- `AUTH_PROVIDER=mariadb`
- `API_PORT=3014`
- `SQLITE_PATH`
- `MARIADB_HOST`
- `MARIADB_PORT`
- `MARIADB_DATABASE`
- `MARIADB_USER`
- `MARIADB_PASSWORD`
- `MARIADB_AUTH_TABLE`
- `MARIADB_USERNAME_COLUMN`
- `MARIADB_PASSWORD_COLUMN`
- `MARIADB_FULL_NAME_COLUMN` or both `MARIADB_FIRST_NAME_COLUMN` and `MARIADB_LAST_NAME_COLUMN`
- `MARIADB_ACTIVE_COLUMN`
- `MARIADB_PASSWORD_HASH_MODE`
- `SMOKE_LOGIN_USERNAME`
- `SMOKE_LOGIN_PASSWORD`

### Verified Live Mapping Example

The currently verified live mapping is:

- `MARIADB_AUTH_TABLE=personnel`
- `MARIADB_USERNAME_COLUMN=username`
- `MARIADB_PASSWORD_COLUMN=password`
- `MARIADB_FIRST_NAME_COLUMN=fname`
- `MARIADB_LAST_NAME_COLUMN=lname`
- `MARIADB_ACTIVE_COLUMN=none` because an explicit sentinel is more reliable than a blank environment value in shell-driven live tests
- `MARIADB_PASSWORD_HASH_MODE=md5`

This live mapping was verified successfully with:

- connectivity check passing
- `md5` probe passing
- login success
- local SQLite provisioning success
- `/api/me` success
- logout and session revocation success

## Password Hash Mode

`MARIADB_PASSWORD_HASH_MODE` must match the legacy system exactly. Supported values are:

- `bcrypt`
- `bun-password`
- `plaintext`
- `md5`
- `sha1`

For the current HR schema, the expected value is `md5`. If the legacy system uses any other verification rule, stop here and implement a dedicated adapter before attempting the live test.

## Command Sequence

```bash
bun install
bun run --cwd apps/api typecheck
bun run --cwd apps/api test
bun run db:migrate
bun run db:seed
NODE_ENV=development AUTH_PROVIDER=mariadb bun run --cwd apps/api auth:check-mariadb
NODE_ENV=development AUTH_PROVIDER=mariadb bun run --cwd apps/api auth:smoke-login
NODE_ENV=development AUTH_PROVIDER=mariadb API_PORT=3014 bun run --cwd apps/api start
```

The smoke scripts use environment variables only. Do not paste passwords into the command line history if your shell records it. Prefer exporting them in the current session first.

## Expected Results

### `auth:check-mariadb`

Expected safe JSON fields:

- `connection`
- `table_found`
- `required_columns_found`
- `active_column_detected`
- `hash_mode`
- `available_columns`

Healthy output should show:

- `connection = ok`
- `table_found = true`
- `required_columns_found = true`
- `required_columns_found = true`
- `active_column_present = false`
- `hash_mode = md5`

### `auth:smoke-login`

Expected safe JSON fields:

- masked `username`
- `login_status = 200`
- `session_cookie_set = true`
- `csrf_cookie_set = true`
- `session_persisted_hashed = true`
- `provisioning.action = created_new` or `updated_existing`
- `me.status = 200`
- `logout.status = 200`
- `logout.session_revoked = true`
- `post_logout_me_status = 401`

## Failure Interpretation

- `AUTH_UPSTREAM_UNAVAILABLE`
  - MariaDB host, port, credentials, or network path is unavailable.
- `required_columns_found = false`
  - The configured table or column names do not match the live schema.
- `AUTH_PROVIDER_FAILURE`
  - The upstream row shape, MD5 digest format, or password verification mode does not match the configured adapter.
- `AUTH_INVALID_CREDENTIALS`
  - The supplied smoke account credentials are incorrect for the configured verification mode.
- `AUTH_ACCOUNT_INACTIVE`
  - The local SQLite user is inactive, or the upstream account is inactive when an active column exists.
- repeated MD5 mismatch
  - Check `MARIADB_PASSWORD_HASH_MODE=md5`, confirm the legacy column mapping, and verify the upstream system stores lowercase hex digests as expected by this adapter.
- wrong column mapping
  - Re-check `MARIADB_PASSWORD_COLUMN`, `MARIADB_FIRST_NAME_COLUMN`, `MARIADB_LAST_NAME_COLUMN`, and `MARIADB_USERNAME_COLUMN`.
- `Unknown column 'is_active'`
  - The live shell likely passed an empty active-column value poorly. Use `MARIADB_ACTIVE_COLUMN=none` explicitly.
- `post_logout_me_status != 401`
  - Session revocation or cookie handling is not behaving correctly.

## Rollback And Cleanup

- Stop any local API server started for this run.
- Remove any temporary shell variables that contain secrets.
- If a new local user was provisioned into SQLite only for the smoke test, decide whether to keep it for future testing or delete it manually in a controlled maintenance step.
- Do not delete SQLite rows blindly from ad hoc shell history without confirming the target database path first.

## Security Cautions

- Never commit `.env` files with real MariaDB credentials.
- Never paste `SMOKE_LOGIN_PASSWORD` into chat or ticket history.
- Never paste raw session cookies, session tokens, or password hashes into logs.
- Share only masked usernames such as `12***5`.
- Keep `AUTH_PROVIDER=dev` disabled during live verification.

## Evidence To Capture

Paste back only:

- the masked username used
- the `auth:check-mariadb` JSON result
- the `auth:smoke-login` JSON result
- the `GET /api/me` summary fields from the smoke output
- whether provisioning was `created_new` or `updated_existing`
- whether logout revocation succeeded

Do not paste:

- passwords
- raw cookies
- session tokens
- password hashes
- full connection strings
