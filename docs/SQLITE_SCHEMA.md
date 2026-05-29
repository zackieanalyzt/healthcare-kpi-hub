# healthcare-kpi-hub SQLite Schema Specification

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering
**Primary References**:
- `docs/DOMAIN_MODEL.md`
- `docs/AUTH_INTEGRATION.md`
- `docs/IMPORT_SPEC.md`
- `docs/DECISIONS.md`

---

## 1. Purpose

เอกสารนี้กำหนด SQLite schema ของระบบในระดับ implementation-ready ครอบคลุม table design, foreign keys, indexes, enum governance, timestamp rules, migration policy, และ SQLite operational baseline

---

## 2. Global Conventions

### Naming

- table names: lowercase snake_case plural
- columns: lowercase snake_case
- primary keys: `id`
- foreign keys: `<entity>_id`

### Identifier Type

- all primary keys use `TEXT`
- IDs are generated in application layer as UUID or ULID

### Boolean Type

- use `INTEGER` with `0`/`1`

### Timestamp Type

- use UTC ISO-8601 text strings

---

## 3. Timestamp Rules

- all persisted timestamps are UTC
- backend application generates timestamps, not the client
- `created_at` is write-once
- `updated_at` is updated by backend application on every state mutation
- `last_login_at`, `last_seen_at`, `occurred_at`, `due_at`, `expires_at` are server-generated or server-normalized only
- client-provided timestamps may be accepted for optimistic concurrency comparison but are never trusted as persisted source of truth

---

## 4. Enum Governance

### Roles

- allowed values: `admin`, `manager`, `editor`, `viewer`
- seed ownership: security/domain seed
- validation responsibility: application layer and migration seed review

### Permissions

- allowed values:
  - `worklist.read`
  - `kpi.read`
  - `kpi.update`
  - `kpi.import`
  - `dashboard.read`
  - `admin.navigation`
  - `admin.kpi_definition`
  - `admin.users`
  - `audit.read`
- seed ownership: security/domain seed
- validation responsibility: application layer

### `reporting_periods.period_type`

- allowed values: `monthly`, `quarterly`, `yearly`
- seed ownership: domain/application
- validation responsibility: application layer

### `reporting_periods.status`

- allowed values: `planned`, `open`, `closed`, `archived`
- seed ownership: domain/application
- validation responsibility: service layer

### `kpi_definitions.value_type`

- allowed values: `numeric`, `percentage`, `milestone`, `note`, `owner`, `due_date`, `status`
- seed ownership: domain/application
- validation responsibility: application and admin service layer

### `kpi_definitions.preset_code`

- allowed values: `numeric_target_actual`, `percentage`, `milestone`, `note`, `owner_due_status`
- seed ownership: domain/application
- validation responsibility: application and admin service layer

### `kpi_page_hierarchy.hierarchy_level`

- allowed values: `organization`, `department`, `unit`, `individual`
- seed ownership: domain/application
- validation responsibility: application layer and read-model composition review
- governance note: intentionally simplified for the current release; additional levels require controlled migration

### `kpi_entries.status`

- allowed values: `draft`, `pending`, `submitted`, `locked`
- seed ownership: domain/application
- validation responsibility: service layer

### `import_jobs.status`

- allowed values: `uploaded`, `parsed`, `validated`, `ready_to_commit`, `committed`, `failed`
- seed ownership: import/application
- validation responsibility: import service layer

---

## 5. Table Specifications

### 5.1 `roles`

| Column | Type | Null | Notes |
|---|---|---|---|
| `code` | `TEXT` | no | PK |
| `name` | `TEXT` | no | human-readable |

### 5.2 `permissions`

| Column | Type | Null | Notes |
|---|---|---|---|
| `code` | `TEXT` | no | PK |
| `name` | `TEXT` | no | human-readable |

### 5.3 `role_permissions`

| Column | Type | Null | Notes |
|---|---|---|---|
| `role_code` | `TEXT` | no | FK to `roles.code` |
| `permission_code` | `TEXT` | no | FK to `permissions.code` |

constraints:

- PK `(role_code, permission_code)`

### 5.4 `users`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `TEXT` | no | PK |
| `username` | `TEXT` | no | unique |
| `full_name` | `TEXT` | yes | |
| `role_code` | `TEXT` | no | FK to `roles.code` |
| `is_active` | `INTEGER` | no | default `1` |
| `last_login_at` | `TEXT` | yes | UTC |
| `created_at` | `TEXT` | no | UTC |
| `updated_at` | `TEXT` | no | UTC |

### 5.5 `sessions`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `TEXT` | no | PK |
| `user_id` | `TEXT` | no | FK to `users.id` |
| `username` | `TEXT` | no | denormalized for diagnostics |
| `token_hash` | `TEXT` | no | unique |
| `expires_at` | `TEXT` | no | UTC |
| `created_at` | `TEXT` | no | UTC |
| `last_seen_at` | `TEXT` | yes | UTC |

### 5.6 `workgroups`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `TEXT` | no | PK |
| `code` | `TEXT` | no | unique |
| `name` | `TEXT` | no | |
| `sort_order` | `INTEGER` | no | |
| `is_active` | `INTEGER` | no | default `1` |

### 5.7 `sections`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `TEXT` | no | PK |
| `workgroup_id` | `TEXT` | no | FK to `workgroups.id` |
| `code` | `TEXT` | no | |
| `name` | `TEXT` | no | |
| `sort_order` | `INTEGER` | no | |
| `is_active` | `INTEGER` | no | default `1` |

constraints:

- unique `(workgroup_id, code)`

### 5.8 `kpi_pages`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `TEXT` | no | PK |
| `section_id` | `TEXT` | no | FK to `sections.id` |
| `code` | `TEXT` | no | |
| `name` | `TEXT` | no | |
| `description` | `TEXT` | yes | |
| `sort_order` | `INTEGER` | no | |
| `is_active` | `INTEGER` | no | default `1` |

constraints:

- unique `(section_id, code)`

### 5.9 `kpi_definitions`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `TEXT` | no | PK |
| `kpi_page_id` | `TEXT` | no | FK to `kpi_pages.id` |
| `code` | `TEXT` | no | |
| `name` | `TEXT` | no | |
| `unit` | `TEXT` | yes | |
| `value_type` | `TEXT` | no | governed enum |
| `preset_code` | `TEXT` | no | governed enum |
| `owner_label` | `TEXT` | yes | |
| `sort_order` | `INTEGER` | no | |
| `is_active` | `INTEGER` | no | default `1` |
| `created_at` | `TEXT` | no | UTC |
| `updated_at` | `TEXT` | no | UTC |

constraints:

- unique `(kpi_page_id, code)`

### 5.10 `kpi_page_hierarchy`

| Column | Type | Null | Notes |
|---|---|---|---|
| `kpi_page_id` | `TEXT` | no | PK, FK to `kpi_pages.id` |
| `parent_kpi_page_id` | `TEXT` | yes | FK to `kpi_pages.id` |
| `hierarchy_level` | `TEXT` | no | governed enum |
| `owner_label` | `TEXT` | yes | read-only ownership context |
| `owner_user_id` | `TEXT` | yes | FK to `users.id` |
| `sort_order` | `INTEGER` | no | sibling ordering |

constraints:

- one hierarchy record per `kpi_page`
- hierarchy metadata is separate from navigation grouping
- parent-child hierarchy is page-to-page, not section-to-section
- current release assumes tree structure, not DAG or multi-parent ownership
- ownership is modeled only through `owner_label` and optional `owner_user_id` in the current release

future evolution note:

- if ownership must reference roles, committees, teams, workgroups, departments, or other entity classes, evolve toward a typed owner reference model such as `owner_type` plus `owner_reference_id` through a dedicated schema migration

### 5.11 `reporting_periods`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `TEXT` | no | PK |
| `period_key` | `TEXT` | no | unique |
| `period_type` | `TEXT` | no | governed enum |
| `starts_at` | `TEXT` | no | UTC |
| `ends_at` | `TEXT` | no | UTC |
| `status` | `TEXT` | no | governed enum |
| `created_at` | `TEXT` | no | UTC |
| `updated_at` | `TEXT` | no | UTC |

### 5.12 `kpi_entries`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `TEXT` | no | PK |
| `kpi_definition_id` | `TEXT` | no | FK to `kpi_definitions.id` |
| `reporting_period_id` | `TEXT` | no | FK to `reporting_periods.id` |
| `status` | `TEXT` | no | governed enum |
| `assigned_to_user_id` | `TEXT` | yes | FK to `users.id` |
| `due_at` | `TEXT` | yes | UTC |
| `updated_at` | `TEXT` | no | UTC |
| `updated_by_user_id` | `TEXT` | yes | FK to `users.id` |
| `created_at` | `TEXT` | no | UTC |

constraints:

- unique `(kpi_definition_id, reporting_period_id)`
- mutation workflow uses `updated_at` as the optimistic concurrency token
- ordinary operational mutation is allowed only while the related reporting period is `open`
- `locked` entries reject ordinary update attempts in the service layer

### 5.13 `entry_values`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `TEXT` | no | PK |
| `kpi_entry_id` | `TEXT` | no | unique FK to `kpi_entries.id` |
| `target_value` | `TEXT` | yes | |
| `actual_value` | `TEXT` | yes | |
| `progress_value` | `REAL` | yes | |
| `note` | `TEXT` | yes | |
| `extra_json` | `TEXT` | yes | controlled JSON |
| `updated_at` | `TEXT` | no | UTC |

governance notes:

- `entry_values` is operational data owned by the `kpi_entries` service
- the first mutation implementation updates only `actual_value`, `progress_value`, and `note`
- `target_value` and `extra_json` remain deferred from the first mutation release
- absence of an `entry_values` row is valid before the first operational update

### 5.14 `import_jobs`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `TEXT` | no | PK |
| `source_filename` | `TEXT` | no | sanitized display/storage name |
| `status` | `TEXT` | no | governed enum |
| `created_by_user_id` | `TEXT` | no | FK to `users.id` |
| `created_at` | `TEXT` | no | UTC |
| `summary_json` | `TEXT` | yes | controlled JSON |

### 5.15 `audit_events`

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `TEXT` | no | PK |
| `entity_type` | `TEXT` | no | string taxonomy |
| `entity_id` | `TEXT` | no | opaque target identifier |
| `action` | `TEXT` | no | semantic event action |
| `actor_user_id` | `TEXT` | yes | FK to `users.id` |
| `actor_username` | `TEXT` | yes | denormalized for diagnostics |
| `occurred_at` | `TEXT` | no | UTC |
| `payload_json` | `TEXT` | yes | controlled JSON |

---

## 6. Foreign Keys and Referential Actions

| Table | Column | References | ON UPDATE | ON DELETE |
|---|---|---|---|---|
| `role_permissions` | `role_code` | `roles.code` | `CASCADE` | `RESTRICT` |
| `role_permissions` | `permission_code` | `permissions.code` | `CASCADE` | `RESTRICT` |
| `users` | `role_code` | `roles.code` | `CASCADE` | `RESTRICT` |
| `sessions` | `user_id` | `users.id` | `CASCADE` | `CASCADE` |
| `sections` | `workgroup_id` | `workgroups.id` | `CASCADE` | `RESTRICT` |
| `kpi_pages` | `section_id` | `sections.id` | `CASCADE` | `RESTRICT` |
| `kpi_definitions` | `kpi_page_id` | `kpi_pages.id` | `CASCADE` | `RESTRICT` |
| `kpi_page_hierarchy` | `kpi_page_id` | `kpi_pages.id` | `CASCADE` | `CASCADE` |
| `kpi_page_hierarchy` | `parent_kpi_page_id` | `kpi_pages.id` | `CASCADE` | `SET NULL` |
| `kpi_page_hierarchy` | `owner_user_id` | `users.id` | `CASCADE` | `SET NULL` |
| `kpi_entries` | `kpi_definition_id` | `kpi_definitions.id` | `CASCADE` | `RESTRICT` |
| `kpi_entries` | `reporting_period_id` | `reporting_periods.id` | `CASCADE` | `RESTRICT` |
| `kpi_entries` | `assigned_to_user_id` | `users.id` | `CASCADE` | `SET NULL` |
| `kpi_entries` | `updated_by_user_id` | `users.id` | `CASCADE` | `SET NULL` |
| `entry_values` | `kpi_entry_id` | `kpi_entries.id` | `CASCADE` | `CASCADE` |
| `import_jobs` | `created_by_user_id` | `users.id` | `CASCADE` | `RESTRICT` |
| `audit_events` | `actor_user_id` | `users.id` | `CASCADE` | `SET NULL` |

guidance:

- `RESTRICT` is preferred for master data tied to historical business state
- `SET NULL` is used when history must remain but actor/assignee relation may be removed
- `CASCADE` is limited to dependent technical records such as sessions and entry_values

---

## 7. Required Indexes

- unique index on `users.username`
- unique index on `sessions.token_hash`
- unique index on `workgroups.code`
- unique index on `sections(workgroup_id, code)`
- unique index on `kpi_pages(section_id, code)`
- unique index on `kpi_definitions(kpi_page_id, code)`
- unique index on `kpi_page_hierarchy.kpi_page_id`
- unique index on `reporting_periods.period_key`
- unique index on `kpi_entries(kpi_definition_id, reporting_period_id)`
- unique index on `entry_values.kpi_entry_id`
- index on `sessions.user_id`
- index on `sections.workgroup_id`
- index on `kpi_pages.section_id`
- index on `kpi_page_hierarchy(parent_kpi_page_id, sort_order)`
- index on `kpi_definitions.kpi_page_id`
- index on `kpi_entries.reporting_period_id`
- index on `kpi_entries.assigned_to_user_id`
- index on `audit_events.actor_user_id`

---

## 8. Optional and Performance Indexes

- index on `users.role_code`
- index on `kpi_entries.updated_by_user_id`
- index on `import_jobs.created_by_user_id`
- index on `audit_events.entity_type`
- composite index on `audit_events(entity_type, entity_id)`

add only after query verification or when justified by implementation of corresponding modules

---

## 9. Worklist Query Indexes

required for worklist performance:

- composite index on `kpi_entries(reporting_period_id, status)`
- composite index on `kpi_entries(assigned_to_user_id, due_at)`
- composite index on `kpi_entries(reporting_period_id, assigned_to_user_id, status)`
- index on `kpi_definitions(kpi_page_id, sort_order)`

---

## 10. Dashboard Query Indexes

required for dashboard aggregation:

- composite index on `kpi_entries(reporting_period_id, status)`
- index on `kpi_entries(updated_at)`
- index on `kpi_definitions.kpi_page_id`

optional based on real queries:

- composite index on `kpi_entries(reporting_period_id, updated_at)`

---

## 11. JSON Field Governance

allowed JSON columns:

- `entry_values.extra_json`
- `import_jobs.summary_json`
- `audit_events.payload_json`

rules:

- JSON content must be validated by application layer
- JSON fields must not replace primary relational design
- `payload_json` must exclude secrets and sensitive credentials
- `entry_values.extra_json` must not be used to bypass deferred structured mutation policy

---

## 12. Migration Strategy

### Naming Convention

- format: `YYYYMMDDHHMM_<short_description>.sql`
- example: `202605281100_create_core_identity_tables.sql`

### Deterministic Rules

- migrations are append-only
- migrations must be idempotent only where explicitly designed; default expectation is single-application in ordered sequence
- migrations must not depend on wall-clock branching behavior
- schema and seed changes must be reviewable from version control

### Rollback Expectations

- destructive rollback is not assumed safe by default
- every migration PR must state whether rollback is:
  - `reversible`
  - `forward-fix only`

### Seed Ordering

1. roles
2. permissions
3. role_permissions
4. navigation master data
5. reporting periods baseline
6. admin bootstrap user overrides if needed

---

## 13. SQLite Operational Baseline

### WAL Mode Policy

- use `WAL` mode in all non-test environments by default

### Pragma Expectations

- `PRAGMA foreign_keys = ON`
- `PRAGMA journal_mode = WAL`
- `PRAGMA synchronous = NORMAL`
- `PRAGMA busy_timeout = 5000`

### Concurrent Write Assumptions

- application assumes low-to-moderate concurrent writes
- SQLite single-writer limitation is acceptable for current workload
- long-running write transactions must be avoided

### Backup Strategy

- perform scheduled file-level backups when application is quiescent or through SQLite-safe backup mechanism
- retain multiple restore points
- backup schedule belongs to operations runbook

### Restore Validation

- every restore procedure must include integrity verification
- restored DB must be checked with SQLite integrity validation and smoke-tested against core queries

### Corruption Recovery Expectations

- detect corruption through operational alerts or failed integrity checks
- stop write traffic before recovery
- restore from latest validated backup
- record recovery event in operations log

---

## 14. Implementation Notes

- foreign key support must be enabled explicitly in every connection
- hard delete of master business entities should be avoided in application behavior even when schema permits removal through controlled admin tooling
- use soft disable (`is_active`) for navigational and definitional entities

---

## 15. Definition of Done

schema spec นี้ถือว่า implementation-ready เมื่อ:

- table definitions, FK behavior, indexes, enums, timestamps, migration rules, และ SQLite operational baseline ถูกกำหนดครบ
- backend team สามารถเริ่มสร้าง migrations ได้โดยไม่ต้องเดา referential behavior หรือ runtime assumptions เอง
