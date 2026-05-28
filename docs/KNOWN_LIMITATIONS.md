# Known Limitations

**Checkpoint**: `v0.2-foundation-live-auth-verified`
**Date**: 2026-05-28

## Current Limitations

- live MariaDB authentication is verified only for the currently configured legacy `personnel` schema mapping
- upstream inactive-account rejection cannot be verified on the current live schema because no active/status column is present
- KPI page read-only expansion is not implemented yet
- KPI mutation workflow is intentionally deferred
- import commit workflow is intentionally deferred
- dashboard aggregation is intentionally deferred
- admin mutation UX is intentionally deferred
- async jobs and realtime delivery are intentionally deferred

## Operational Notes

- SQLite runtime artifacts are local-only and must remain ignored
- live auth smoke checks require manual environment provisioning and must not be baked into CI
- legacy password verification beyond the verified `md5` path requires a dedicated adapter and ADR before adoption
