# healthcare-kpi-hub Implementation Ticket Map

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering

---

## 1. Foundation

### T1 Repo and Package Structure

- dependencies: `ARCHITECTURE.md`, `MODULE_BOUNDARIES.md`
- acceptance criteria:
  - repo folders reflect backend/frontend/shared boundaries
- blocking risks:
  - unclear module ownership
- related docs:
  - `ARCHITECTURE.md`
  - `MODULE_BOUNDARIES.md`

### T2 CI and Quality Baseline

- dependencies: `ENGINEERING_WORKING_AGREEMENT.md`
- acceptance criteria:
  - lint, typecheck, test placeholders, docs checks defined
- blocking risks:
  - toolchain inconsistency
- related docs:
  - `ENGINEERING_WORKING_AGREEMENT.md`

### T3 Config and Environment Conventions

- dependencies: `IMPLEMENTATION_ROADMAP.md`
- acceptance criteria:
  - env var naming and secrets handling baseline documented in repo
- blocking risks:
  - secret drift

### T4 SQLite Migration Tooling and Seed Baseline

- dependencies: `SQLITE_SCHEMA.md`, `SQLITE_OPERATIONS.md`
- acceptance criteria:
  - migration naming, seed ordering, and execution baseline prepared
- blocking risks:
  - non-deterministic schema evolution

---

## 2. Auth

### T5 Session Middleware Scaffold

- dependencies: `AUTH_INTEGRATION.md`
- acceptance criteria:
  - middleware contract defined for session validation path
- blocking risks:
  - auth drift with API contract

### T6 CSRF Baseline Scaffold

- dependencies: `AUTH_INTEGRATION.md`, `API_CONTRACT.md`
- acceptance criteria:
  - mutation request policy scaffolded
- blocking risks:
  - frontend/backend mismatch

### T7 Login Flow Skeleton

- dependencies: `AUTH_INTEGRATION.md`, `API_CONTRACT.md`
- acceptance criteria:
  - auth module interfaces mapped to login/logout/me endpoints
- blocking risks:
  - MariaDB integration uncertainty

### T8 RBAC Middleware

- dependencies: `RBAC_MATRIX.md`, `AUTH_INTEGRATION.md`
- acceptance criteria:
  - permission enforcement scaffold uses deny-by-default
- blocking risks:
  - permission mapping inconsistency

---

## 3. Navigation

### T9 Navigation Read-Only API

- dependencies: `API_CONTRACT.md`, `DOMAIN_MODEL.md`
- acceptance criteria:
  - navigation module read contract matches API spec
- blocking risks:
  - hierarchy ownership ambiguity

### T10 Worklist Read-Only Vertical Slice

- dependencies: `API_CONTRACT.md`, `FRONTEND_SCREEN_MAP.md`, `MODULE_BOUNDARIES.md`
- acceptance criteria:
  - worklist read model contract defined and testable
- blocking risks:
  - KPI entry generation assumptions unresolved in code

---

## 4. KPI Operations

### T11 KPI Definition Module Skeleton

- dependencies: `KPI_DEFINITION_VERSIONING.md`, `DOMAIN_MODEL.md`
- acceptance criteria:
  - module contracts reflect clone-and-replace semantic versioning policy
- blocking risks:
  - historical integrity violations

### T12 KPI Entry Read/Update Skeleton

- dependencies: `API_CONTRACT.md`, `DOMAIN_MODEL.md`
- acceptance criteria:
  - optimistic concurrency path and editability checks defined
- blocking risks:
  - workflow state drift

### T13 Reporting Period Service Skeleton

- dependencies: `DOMAIN_MODEL.md`
- acceptance criteria:
  - open/close period lifecycle contract established
- blocking risks:
  - period state semantics drift

---

## 5. Import

### T14 Import Upload and Job Creation Skeleton

- dependencies: `IMPORT_SPEC.md`, `API_CONTRACT.md`
- acceptance criteria:
  - upload contract and job lifecycle scaffold defined
- blocking risks:
  - file security handling gaps

### T15 Import Parse and Preview Skeleton

- dependencies: `IMPORT_SPEC.md`
- acceptance criteria:
  - validation stages mapped to service boundaries
- blocking risks:
  - malformed file handling unclear

### T16 Import Commit Orchestration Skeleton

- dependencies: `IMPORT_SPEC.md`, `MODULE_BOUNDARIES.md`, `KPI_DEFINITION_VERSIONING.md`
- acceptance criteria:
  - commit orchestration boundary defined without full mutation implementation
- blocking risks:
  - idempotency/replay handling incomplete

---

## 6. Audit

### T17 Audit Emission Infrastructure

- dependencies: `AUDIT_AND_LOGGING_POLICY.md`, `MODULE_BOUNDARIES.md`
- acceptance criteria:
  - audit record contract and emission helper baseline defined
- blocking risks:
  - business vs technical event confusion

### T18 Structured Logging Baseline

- dependencies: `AUDIT_AND_LOGGING_POLICY.md`
- acceptance criteria:
  - request_id and category rules mapped into logging baseline
- blocking risks:
  - sensitive data leakage

---

## 7. Notes

- audit viewer full implementation remains deferred
- dashboard aggregation full implementation remains deferred
- import commit real mutation remains deferred until foundation scaffolds settle
