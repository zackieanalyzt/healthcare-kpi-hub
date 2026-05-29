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

## ADR-011: Separate KPI Ownership Hierarchy from Navigation Grouping

- Status: Accepted
- Date: 2026-05-29
- Context:
  - KPI ownership is hierarchical from organization down to individual
  - the existing navigation model is grouped by workgroup, section, and page for operational browsing
  - overloading navigation sections alone to represent ownership hierarchy would create drift between UI grouping and domain ownership
- Decision:
  - keep `workgroups -> sections -> kpi_pages` as the navigation and browse structure
  - treat a `kpi_page` as a hierarchy-aware node by attaching read-only hierarchy metadata through dedicated page hierarchy records
  - use `GET /api/kpi-pages/:pageId` as the hierarchy-aware read model that returns current node, parent node, child nodes, and KPI assignments
- Consequences:
  - KPI page detail can be hierarchy-aware without coupling the entire navigation tree to ownership semantics
  - future hierarchy mutations can be designed independently from read-only page composition
  - seed data and frontend detail screens must display hierarchy context explicitly

## ADR-012: Treat KPIDefinition as a KPI Template, Not a Period-Specific Master Record

- Status: Accepted
- Date: 2026-05-29
- Context:
  - KPI meaning must remain stable across reporting periods unless a controlled versioning change is introduced
  - worklist, imports, and dashboards need repeatable KPI semantics that can spawn period-specific operational entries
  - a period-specific master record model would blur the boundary between KPI design and KPI execution
- Decision:
  - treat `KPIDefinition` as a template-level record that defines stable KPI semantics for future operational use
  - treat `KPIEntry` as the period-specific operational instance of one `KPIDefinition`
  - keep imports and dashboards anchored to `KPIEntry` and `EntryValue`, while preserving semantic lineage back to `KPIDefinition`
- Consequences:
  - future reporting periods can create or reference entries from stable templates without redefining KPI meaning each cycle
  - dashboard aggregation can group operational results by template lineage while respecting period-specific values
  - KPI versioning must clone or revise templates through controlled semantics rather than mutating historical meaning in place
  - audit trails should distinguish template governance events from operational entry/value events

## ADR-013: KPI Ownership Hierarchy Is Intentionally Tree-Structured

- Status: Accepted
- Date: 2026-05-29
- Context:
  - current read-only hierarchy implementation links one `kpi_page` to at most one parent page
  - healthcare ownership can become cross-functional, but multi-parent support would change validation, navigation, imports, dashboards, and authorization semantics significantly
- Decision:
  - current KPI ownership hierarchy intentionally assumes a tree structure
  - each hierarchy node may have zero or one parent, and zero-to-many children
  - DAG and multi-parent ownership models are explicitly deferred to a future architecture phase
- Consequences:
  - current schema and API remain simpler and deterministic for read-only expansion
  - future cross-functional ownership requires an ADR, schema evolution, and contract revision before implementation

## ADR-014: Simplify Hierarchy Levels for the Current Release

- Status: Accepted
- Date: 2026-05-29
- Context:
  - the first hierarchy-aware release needs a small, understandable ownership vocabulary
  - legacy organizations may contain additional concepts such as division, section, program, or committee
- Decision:
  - constrain hierarchy levels to `organization`, `department`, `unit`, and `individual` for the current release
  - treat these levels as intentionally simplified, not exhaustive
- Consequences:
  - current read models and seeds stay comprehensible and repeatable
  - if additional levels become necessary, they must be introduced through controlled migration, enum governance updates, and API contract revision

## ADR-015: Keep Ownership Modeling Simple with `owner_label` and Optional `owner_user_id`

- Status: Accepted
- Date: 2026-05-29
- Context:
  - current read-only hierarchy needs to display ownership context without introducing a new polymorphic ownership subsystem
  - future ownership may include role, committee, team, workgroup, department, or other non-user entities
- Decision:
  - keep the current implementation limited to `owner_label` plus optional `owner_user_id`
  - do not introduce `owner_type` or `owner_reference` yet
- Consequences:
  - current release remains implementation-light and read-only
  - future ownership expansion should evolve toward a typed owner reference model through a dedicated architecture phase rather than ad hoc column growth
