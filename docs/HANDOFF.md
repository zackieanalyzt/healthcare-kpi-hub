# Handoff

> Historical handoff for an older checkpoint. For the current controlled pilot rehearsal package, read [CURRENT_HANDOFF.md](D:/home/github/healthcare-kpi-hub/docs/CURRENT_HANDOFF.md) first.

**Project**: `healthcare-kpi-hub`  
**Checkpoint**: `v0.2-foundation-live-auth-verified`  
**Commit**: `388f5f16b78ce7077862fb525f6d3a13bd2b395d`  
**Date**: 2026-05-28

## Purpose

This document is the handoff context for continuing work on another machine or in another Codex session without relying on prior chat history.

## Current State

- architecture is stabilized and documented
- runnable monorepo foundation is in place
- backend and frontend scaffolds are working
- SQLite migrations and seeds are operational
- session persistence is implemented with hashed token storage only
- RBAC resolves from SQLite roles and permissions
- read-only `/api/me`, `/api/navigation`, and `/api/worklist` are working end-to-end
- CSRF is enforced on mutation routes
- live MariaDB authentication is verified
- local user provisioning is verified
- logout and session revocation are verified
- typecheck, tests, migrations, and seeds are passing

## Verified Live Auth Mapping

The currently verified MariaDB mapping is configuration-driven and was verified successfully with live login:

- `MARIADB_AUTH_TABLE=personnel`
- `MARIADB_USERNAME_COLUMN=username`
- `MARIADB_PASSWORD_COLUMN=password`
- `MARIADB_FIRST_NAME_COLUMN=fname`
- `MARIADB_LAST_NAME_COLUMN=lname`
- `MARIADB_ACTIVE_COLUMN=none`
- `MARIADB_PASSWORD_HASH_MODE=md5`

## What Was Verified

- live MariaDB connectivity check passed
- live login succeeded for an approved test user
- session cookie and CSRF cookie were set
- session persistence stored hash only
- `/api/me` returned `200`
- default local provisioning behavior worked
- permissions resolved from SQLite
- logout revoked the current session
- `/api/me` returned `401` after logout

## Security Guardrails

- do not commit real `.env` files
- do not commit MariaDB credentials
- do not commit session tokens, cookies, or smoke output with secrets
- do not store plaintext passwords or plaintext session tokens in SQLite
- do not hardcode legacy MariaDB table or column names in service logic
- do not bypass backend authorization in frontend code

## Local-Only Ignored Artifacts

- `apps/api/.env.live-mariadb`
- `apps/api/data/`
- `apps/web/dist/`
- `node_modules/`
- `*.tsbuildinfo`

## Canonical Docs To Read First

- `docs/STATUS.md`
- `docs/CHANGELOG.md`
- `docs/DECISIONS.md`
- `docs/ARCHITECTURE.md`
- `docs/AUTH_INTEGRATION.md`
- `docs/MODULE_BOUNDARIES.md`
- `docs/API_CONTRACT.md`
- `docs/NEXT_PHASE_PLAN.md`

## Recommended Next Phase

Start KPI page read-only expansion from this frozen baseline.

Recommended scope:

- implement `GET /api/kpi-pages/:pageId`
- add read-only backend composition for KPI page detail
- add frontend KPI page route and loading/error/empty states
- extend seeds only for deterministic read-only KPI page scenarios

Explicit non-goals for the next immediate pass:

- KPI mutation workflow
- import commit
- dashboard aggregation
- admin mutation UX
- async jobs
- realtime

## Setup On Another Machine

```bash
git clone https://github.com/zackieanalyzt/healthcare-kpi-hub.git
cd healthcare-kpi-hub
git checkout v0.2-foundation-live-auth-verified
bun install
bun run typecheck
bun run test
bun run db:migrate
bun run db:seed
```

If live MariaDB verification is needed again, use local environment variables only and follow:

- `docs/LIVE_MARIADB_AUTH_TEST_RUNBOOK.md`

## Suggested Prompt For The Next Codex Session

Use this prompt in the next session if you want continuity quickly:

```text
Read docs/HANDOFF.md, docs/STATUS.md, docs/CHANGELOG.md, docs/DECISIONS.md, docs/ARCHITECTURE.md, docs/AUTH_INTEGRATION.md, docs/MODULE_BOUNDARIES.md, docs/API_CONTRACT.md, and docs/NEXT_PHASE_PLAN.md first. Treat tag v0.2-foundation-live-auth-verified as the baseline source of truth. Continue with KPI page read-only expansion only, without implementing mutation workflow, import commit, dashboard aggregation, admin mutation UX, async jobs, or realtime.
```
