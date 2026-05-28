# Changelog

## v0.2-foundation-live-auth-verified - 2026-05-28

### Architecture

- foundation stabilized with canonical architecture, module boundary, API, auth, schema, import, and UX documentation
- repo is established as the canonical implementation baseline
- module boundaries and security guardrails are documented before KPI page expansion

### Runtime

- runnable monorepo baseline established for `apps/api`, `apps/web`, and shared packages
- SQLite migrations and seeds are operational
- structured logging, request tracing, and health endpoints are in place

### Security/Auth

- session persistence hardened with hashed token storage only
- RBAC enforced from SQLite roles and permissions
- CSRF enforced on mutation routes
- live MariaDB authentication verified against the legacy `personnel` schema
- config-driven upstream mapping verified
- legacy `md5` compatibility verified
- no plaintext password or session persistence added to SQLite

### Read-Only Features

- `GET /api/me` verified
- navigation read-only slice verified
- worklist read-only slice verified

### Deferred Scope

- KPI mutation workflow
- import commit mutation
- dashboard aggregation
- admin mutation UX
- realtime and async job systems
