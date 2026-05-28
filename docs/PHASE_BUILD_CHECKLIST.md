# healthcare-kpi-hub Phase Build Checklist

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering

---

## Phase 1: Foundation

- prerequisites:
  - `ARCHITECTURE.md`
  - `MODULE_BOUNDARIES.md`
- implementation scope:
  - repo structure
  - CI
  - config
  - migration tooling
- tests required:
  - lint/typecheck baseline
- security review required:
  - config/secrets handling
- docs update required:
  - engineering agreement if toolchain changes
- migration review required:
  - yes
- release gate:
  - deterministic tooling baseline present

## Phase 2: Auth Baseline

- prerequisites:
  - `AUTH_INTEGRATION.md`
  - `RBAC_MATRIX.md`
- implementation scope:
  - session middleware
  - CSRF scaffold
  - login/logout/me skeleton
  - RBAC middleware
- tests required:
  - auth/session contract tests
- security review required:
  - yes
- docs update required:
  - auth doc if policy changes
- migration review required:
  - users/sessions/roles seeds
- release gate:
  - deny-by-default enforced

## Phase 3: Navigation and Worklist Read Path

- prerequisites:
  - `API_CONTRACT.md`
  - `FRONTEND_SCREEN_MAP.md`
- implementation scope:
  - app shell
  - navigation read API
  - worklist read-only slice
- tests required:
  - route auth tests
  - read-model API tests
- security review required:
  - permission gate review
- docs update required:
  - screen map and API if changed
- migration review required:
  - navigation schema/seed
- release gate:
  - read path stable and permission-safe

## Phase 4: KPI Foundations

- prerequisites:
  - `DOMAIN_MODEL.md`
  - `KPI_DEFINITION_VERSIONING.md`
- implementation scope:
  - definition module skeleton
  - reporting period service skeleton
  - KPI entry read/update skeleton
- tests required:
  - state transition tests
  - optimistic concurrency tests
- security review required:
  - mutation authorization checks
- docs update required:
  - domain and API if changed
- migration review required:
  - yes
- release gate:
  - historical semantics protected

## Phase 5: Import and Audit Foundations

- prerequisites:
  - `IMPORT_SPEC.md`
  - `AUDIT_AND_LOGGING_POLICY.md`
  - `SQLITE_OPERATIONS.md`
- implementation scope:
  - import job creation scaffold
  - parse/preview scaffold
  - structured logging baseline
  - audit emission infrastructure
- tests required:
  - malformed file handling tests
  - audit emission tests
- security review required:
  - import security review
  - log redaction review
- docs update required:
  - import/audit docs if changed
- migration review required:
  - import_jobs/audit_events schema
- release gate:
  - replay-safe baseline and privacy-safe logging in place

---

## Definition of Done

checklist นี้ถือว่าใช้งานได้เมื่อ:

- ทีมสามารถใช้เป็น operational gate ระหว่าง build จริง
- ทุก phase มี prerequisite, test, security, docs, migration, และ gate ครบ
