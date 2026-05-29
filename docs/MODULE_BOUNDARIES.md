# healthcare-kpi-hub Module Boundaries

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering
**Primary References**:
- `docs/ARCHITECTURE.md`
- `docs/DOMAIN_MODEL.md`
- `docs/API_CONTRACT.md`

---

## 1. Purpose

เอกสารนี้กำหนด module boundaries เพื่อป้องกัน dependency chaos, circular service calls, และ business logic leakage

---

## 2. Backend Modules

### `shared`

- responsibilities:
  - shared types, errors, validation helpers, security primitives, logging helpers
- allowed dependencies:
  - none inward on feature modules
- forbidden dependencies:
  - must not depend on feature modules
- public service contracts:
  - reusable helpers only
- persistence ownership:
  - none
- audit emission ownership:
  - none
- transaction ownership:
  - none

### `auth`

- responsibilities:
  - login/logout/session validation/provisioning
- allowed dependencies:
  - `shared`, `audit`
- forbidden dependencies:
  - must not depend on `worklist`, `imports`, `admin` internals
- public service contracts:
  - authenticate(credentials)
  - getCurrentUser(session)
  - revokeSessions(userId)
- persistence ownership:
  - `users`, `sessions`
- audit emission ownership:
  - auth-related events
- transaction ownership:
  - auth provisioning/session creation transaction

### `navigation`

- responsibilities:
  - workgroup/section/page read model and admin-safe mutations exposed via admin orchestration
  - KPI page hierarchy-aware read composition for current page, parent, and child node context
  - preserve separation between browse navigation and ownership hierarchy semantics
- allowed dependencies:
  - `shared`, `audit`
- forbidden dependencies:
  - must not depend on `worklist`
  - must not assume DAG or multi-parent hierarchy semantics in the current release
- public service contracts:
  - getNavigationTree()
  - createWorkgroup()
  - createSection()
  - createPage()
- persistence ownership:
  - `workgroups`, `sections`, `kpi_pages`, `kpi_page_hierarchy`
- audit emission ownership:
  - navigation change events
- transaction ownership:
  - navigation mutation transaction

### `reporting_periods`

- responsibilities:
  - period lifecycle and state transitions
- allowed dependencies:
  - `shared`, `audit`
- forbidden dependencies:
  - must not mutate KPI values directly except via explicit orchestration boundary
- public service contracts:
  - openPeriod()
  - closePeriod()
  - getCurrentPeriod()
- persistence ownership:
  - `reporting_periods`
- audit emission ownership:
  - period open/close events
- transaction ownership:
  - period state change transaction

### `kpi_definitions`

- responsibilities:
  - definition lifecycle, validation, versioning policy enforcement
- allowed dependencies:
  - `shared`, `audit`, `navigation`
- forbidden dependencies:
  - must not depend on `worklist`
- public service contracts:
  - listDefinitions()
  - createDefinition()
  - reviseDefinition()
- persistence ownership:
  - `kpi_definitions`
- audit emission ownership:
  - definition create/update/deactivate
- transaction ownership:
  - definition mutation transaction

### `kpi_entries`

- responsibilities:
  - KPI operational mutations, editability checks, optimistic concurrency
- allowed dependencies:
  - `shared`, `audit`, `kpi_definitions`, `reporting_periods`, read-only `navigation` context
- forbidden dependencies:
  - must not depend on `worklist` internals
- public service contracts:
  - getEntry()
  - listEntriesForPage()
  - updateEntry()
- persistence ownership:
  - `kpi_entries`, `entry_values`
- audit emission ownership:
  - KPI entry and value change events
- transaction ownership:
  - KPI mutation transaction

### `worklist`

- responsibilities:
  - worklist query/read model only
- allowed dependencies:
  - `shared`, read contracts from `kpi_entries`, `navigation`, `reporting_periods`
- forbidden dependencies:
  - must not own KPI mutation logic
  - must not call admin mutations
- public service contracts:
  - getWorklist()
- persistence ownership:
  - none exclusive; read-only composed queries
- audit emission ownership:
  - none
- transaction ownership:
  - none; read-only

### `imports`

- responsibilities:
  - upload, parse, validate, preview, commit orchestration
- allowed dependencies:
  - `shared`, `audit`, `kpi_entries`, `kpi_definitions`, `reporting_periods`
- forbidden dependencies:
  - must not call auth internals directly
  - must not mutate navigation/admin-owned state
- public service contracts:
  - createImportJob()
  - previewImport()
  - commitImport()
- persistence ownership:
  - `import_jobs`
- audit emission ownership:
  - import lifecycle and commit events
- transaction ownership:
  - import commit transaction

### `audit`

- responsibilities:
  - persist and query audit events
- allowed dependencies:
  - `shared`
- forbidden dependencies:
  - must not mutate business state
- public service contracts:
  - recordEvent()
  - listEvents()
- persistence ownership:
  - `audit_events`
- audit emission ownership:
  - storage adapter only; event semantics owned by caller
- transaction ownership:
  - none independently except same-transaction persistence when orchestrated by caller

### `admin`

- responsibilities:
  - orchestration facade for admin use cases spanning navigation, definitions, users
- allowed dependencies:
  - `shared`, `auth`, `navigation`, `kpi_definitions`, `audit`
- forbidden dependencies:
  - must not duplicate mutation logic already owned by child modules
- public service contracts:
  - listUsers()
  - changeUserRole()
- persistence ownership:
  - none exclusive beyond orchestrated calls
- audit emission ownership:
  - admin-level orchestration events
- transaction ownership:
  - orchestration transaction when multiple owned modules change together

---

## 3. Dependency Rules

- import module must not call auth internals directly
- audit module must not mutate business state
- worklist must not own KPI mutation logic
- frontend route state must not bypass backend authorization
- controllers must call services, not repositories directly for business mutations
- admin module may orchestrate, but not re-implement owned child logic

---

## 4. Shared Utilities Rules

### Shared Utility

- pure helpers
- cross-cutting validation primitives
- security helpers
- error and response shaping primitives

### Forbidden God-Module

- module that knows all repositories
- module that centralizes unrelated business rules
- `utils` package containing feature behavior from multiple bounded contexts

### Cross-Cutting Concern

- logging
- tracing/request IDs
- validation primitives
- security primitives

cross-cutting concern ต้องไม่กลายเป็นทางลัดให้ bypass module ownership

---

## 5. Transaction Boundary Guidance

- auth login transaction owner: `auth`
- KPI update transaction owner: `kpi_entries`
- reporting period state change transaction owner: `reporting_periods`
- import commit transaction owner: `imports`
- admin multi-step mutation transaction owner: `admin` orchestration only when required

### Nested Transaction Policy

- avoid nested transactions
- child services inside an existing transaction must participate in caller-owned unit of work

### Audit Emission Timing

- audit records for business mutation should be persisted within the same transaction when practical
- if same-transaction audit is impossible for a flow, mutation must not report success until audit persistence status is known

---

## 6. Anti-Patterns

- circular service calls
- domain mutation inside controller
- audit writes inside DB trigger as primary audit mechanism
- frontend-generated authorization decisions
- repository-to-repository orchestration without service layer
- shared module importing business-specific logic from multiple bounded contexts

---

## 7. Definition of Done

module boundary spec นี้ถือว่า foundation-ready เมื่อ:

- ทีมสามารถสร้าง app skeleton และ module folders ได้โดยไม่เดา ownership เอง
- dependency rules ชัดพอที่จะใช้ review PR และกัน coupling chaos ได้
