# healthcare-kpi-hub Decision Log

**Status**: Active
**Date Started**: 2026-05-28
**Owner**: Engineering
**Rule**: Append-only ADR log

---

## ADR-001: Use SQLite for Application Data

- Status: Accepted
- Date: 2026-05-28
- Context:
  - the new application needs low operational overhead
  - the expected workload fits a single-organization application database
- Decision:
  - use SQLite as the source of truth for application state
- Consequences:
  - schema and migrations must remain deterministic
  - SQLite operational guidance must be documented and enforced

## ADR-002: Keep MariaDB as Authentication Source

- Status: Accepted
- Date: 2026-05-28
- Context:
  - the organization already has a legacy credential source
  - password duplication into the new app is not acceptable
- Decision:
  - use MariaDB only for credential verification and required personnel lookup
- Consequences:
  - authorization, sessions, and local roles remain owned by the new app

## ADR-003: Adopt Worklist-First UX

- Status: Accepted
- Date: 2026-05-28
- Context:
  - the primary users are operational staff, not dashboard-only viewers
- Decision:
  - the first post-login experience is the worklist, not the dashboard
- Consequences:
  - navigation and KPI entry lifecycle must prioritize operational flow first

## ADR-004: Use Hybrid Config Instead of Fully Dynamic Schema

- Status: Accepted
- Date: 2026-05-28
- Context:
  - the legacy dynamic model created complexity and drift
- Decision:
  - use preset and template-driven KPI configuration with explicit guardrails
- Consequences:
  - flexibility is intentionally limited to preserve maintainability

## ADR-005: Use Service-Layer Audit Instead of Trigger-Heavy Audit

- Status: Accepted
- Date: 2026-05-28
- Context:
  - the system needs business-significant audit events with clear semantics
- Decision:
  - emit audit events from the service and application layer
- Consequences:
  - audit payloads remain tied to business meaning instead of low-level DB changes

## ADR-006: New Repo Is the Canonical Implementation

- Status: Accepted
- Date: 2026-05-28
- Context:
  - the legacy repo is not the target architecture
- Decision:
  - `healthcare-kpi-hub` is the canonical codebase and documentation source of truth
- Consequences:
  - the legacy repo is reference-only

## ADR-007: Default Role for First-Time Login Is Viewer

- Status: Accepted
- Date: 2026-05-28
- Context:
  - the system needs a least-privilege baseline for provisioned users
- Decision:
  - the first successful login creates a local user with role `viewer`
- Consequences:
  - any elevated access must be granted explicitly in SQLite

## ADR-008: Use Config-Driven MariaDB Identity Mapping

- Status: Accepted
- Date: 2026-05-28
- Context:
  - live upstream schemas vary across legacy HR tables
  - auth service must not hardcode table or column names
- Decision:
  - upstream identity mapping is configured by environment variables for table name, username column, password column, and allowed name fields
- Consequences:
  - live auth verification can switch schemas safely without changing business logic
  - diagnostics and runbooks must document the verified live mapping explicitly

## ADR-009: Support Legacy MD5 Authentication and Explicit No-Active Sentinel

- Status: Accepted
- Date: 2026-05-28
- Context:
  - the verified legacy `personnel` schema authenticates against an MD5-backed password field
  - the verified live schema has no upstream active or status column
- Decision:
  - support `MARIADB_PASSWORD_HASH_MODE=md5`
  - support `MARIADB_ACTIVE_COLUMN=none` as the explicit shell-safe sentinel for upstreams with no active column
- Consequences:
  - legacy auth can be verified without plaintext fallback
  - shell-based live runs avoid accidental fallback to `is_active` when empty environment values are handled inconsistently

## ADR-010: Freeze a Live-Auth-Verified Foundation Baseline Before KPI Expansion

- Status: Accepted
- Date: 2026-05-28
- Context:
  - the repository now has runnable foundation code, verified auth, and read-only slices
  - uncontrolled feature expansion would increase drift risk
- Decision:
  - create a stable baseline checkpoint before KPI page read-only expansion and any mutation workflow work
- Consequences:
  - docs, changelog, verification commands, commit, and tag must be produced as part of the baseline freeze
