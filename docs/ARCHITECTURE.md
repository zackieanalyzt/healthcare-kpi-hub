# healthcare-kpi-hub Canonical Architecture

**Status**: Foundation Baseline Verified
**Date**: 2026-05-28
**Owner**: Engineering
**Primary References**:
- `docs/ARCHITECTURE_V2.md`
- `docs/API_CONTRACT.md`
- `docs/DOMAIN_MODEL.md`
- `docs/MODULE_BOUNDARIES.md`
- `docs/SQLITE_OPERATIONS.md`

---

## Baseline Note

This document now reflects the verified foundation baseline as of `2026-05-28`.

- monorepo scaffold is runnable and type-safe
- SQLite migrations and seeds are operational
- session persistence stores hashed tokens only
- RBAC resolves from SQLite roles and permissions
- `GET /api/me`, `GET /api/navigation`, and `GET /api/worklist` work end-to-end
- `GET /api/kpi-pages/:pageId` is the hierarchy-aware KPI page read model
- live MariaDB authentication is verified through config-driven mapping
- the currently verified upstream mapping is `personnel.username/password/fname/lname`
- the verified legacy auth settings are `MARIADB_ACTIVE_COLUMN=none` and `MARIADB_PASSWORD_HASH_MODE=md5`
- KPI ownership hierarchy is modeled separately from navigation grouping

This is the stable foundation checkpoint before KPI page read-only expansion and any new mutation workflow.

---

## 1. System Purpose

`healthcare-kpi-hub` คือระบบจัดการ KPI สำหรับหน่วยงานสาธารณสุขที่เน้นการอัปเดตข้อมูลเชิงปฏิบัติการ การติดตามงานค้าง การสรุปภาพรวม และการบริหารโครงสร้าง KPI อย่างมีวินัย

primary users:

- operational staff
- managers/supervisors
- administrators

operational problem ที่ระบบแก้:

- ผู้ใช้ต้องอัปเดต KPI ตามรอบรายงานได้ง่าย
- ผู้จัดการต้องเห็นงานค้างและความเสี่ยงได้ชัด
- ผู้ดูแลระบบต้องกำหนดโครงสร้าง KPI และสิทธิ์ได้โดยไม่ทำให้ระบบเปราะ

---

## 2. Core Architectural Principles

- worklist-first UX
- hybrid config with guardrails
- relational-first persistence
- hierarchy-aware KPI ownership read models
- service-layer audit
- deny-by-default security
- SQLite operational simplicity
- backend-authoritative business logic
- canonical-new-repo governance

---

## 3. System Context

### Frontend

- React-based web client
- รับผิดชอบ presentation, route flow, form interaction, optimistic UI handling บางส่วน
- ไม่ถือ business authority

### Backend

- API application layer
- รับผิดชอบ auth, RBAC, validation, orchestration, domain mutation, audit emission

### SQLite

- application source of truth
- เก็บ users, sessions, navigation, KPI definitions, reporting periods, KPI entries, import jobs, audit events
- stores KPI page hierarchy metadata separately from navigation grouping so ownership context is not flattened into sidebar structure

### MariaDB Auth Source

- ใช้เฉพาะ credential verification และ personnel lookup ที่จำเป็น

### Import Pipeline

- controlled ingestion flow
- upload -> parse -> validate -> preview -> commit -> audit

### Audit Flow

- service layer emits business-significant audit events
- audit module persists and exposes audit records

---

## 4. High-Level Request Lifecycle

### Login Request

Frontend -> Backend API -> Auth Service -> MariaDB verification -> SQLite user provisioning -> SQLite session persistence -> Response with secure cookie

### KPI Update Request

Frontend -> API route -> session auth -> RBAC check -> KPI service -> SQLite mutation -> audit emission -> Response

Mutation guardrails for the first KPI update phase:

- backend compares client-supplied `updated_at` with persisted entry state before mutation
- service layer owns workflow validation, status transitions, and value-rule enforcement
- imports must not bypass the same KPI entry mutation rules

### Import Flow

Frontend upload -> Import route -> file validation -> parse -> validation -> preview -> commit -> KPI mutation service -> audit emission -> response

---

## 5. Bounded Contexts

### Auth

- login/logout/session validation
- user provisioning
- session revocation

### Worklist

- current operational task views
- assigned/overdue/recently updated items

### KPI Operations

- KPI definitions usage
- reporting periods
- KPI entries and values
- editability rules
- hierarchy-aware KPI page detail composition
- clear separation between template governance and period-specific operational records

### Admin

- navigation management
- KPI definition management
- user role management

### Import

- file ingestion
- validation
- preview
- commit orchestration

### Audit

- audit event persistence
- audit query/read model

---

## 6. Frontend/Backend Boundary

### Frontend Responsibilities

- route rendering
- loading/error/empty states
- form input capture
- CSRF token submission
- permission-aware UI hiding or disabling
- hierarchy context presentation for KPI page detail

### Backend Responsibilities

- authoritative auth/session validation
- permission enforcement
- workflow state validation
- domain mutation
- audit emission
- timestamp generation

### Server-Authoritative Behaviors

- current user identity
- session validity
- editability of KPI entries
- reporting period open/closed state
- import commit outcome
- admin mutation authorization

---

## 7. Persistence Responsibility

### MariaDB Responsibilities

- credential verification
- source personnel identity fields

### SQLite Responsibilities

- app users and roles
- sessions
- navigation model
- KPI page hierarchy metadata
- KPI definitions
- reporting periods
- KPI entries and values
- import jobs
- audit events

### Forbidden Storage Patterns

- password replication into SQLite
- plaintext session token storage
- frontend-authored authoritative timestamps
- free-form JSON replacing primary relational model
- forcing ownership hierarchy to be inferred only from navigation sections
- treating period-specific KPI execution records as if they were template definitions

---

## 8. Audit Responsibility

### What Emits Audit

- service-layer business actions
- auth service for login/logout/revocation
- KPI mutation services
- import commit/reject actions
- admin services

### What Should Not Emit Audit

- low-level DB triggers as primary audit mechanism
- controllers writing ad hoc audit rows directly
- frontend-originated “audit events”

### Business-Significant vs Technical Events

- business-significant:
  - login success/failure
  - role change
  - reporting period open/close
  - KPI update
  - import commit

- technical events:
  - parser warnings
  - transient retries
  - connection diagnostics

technical events belong to structured logs, not necessarily audit records

---

## 9. Security Model Summary

- auth: session-based, MariaDB-backed login
- session: secure cookie, server-managed, hashed token persistence
- RBAC: local roles/permissions in SQLite
- CSRF: required for mutation endpoints
- import security: MIME/type/size validation, formula non-execution, replay-aware ingestion
- deny-by-default: new endpoint or screen has no access until explicitly mapped

---

## 10. Operational Constraints

- expected concurrent writers: low to moderate
- SQLite is acceptable under single-writer assumptions with short transactions
- deployment assumes single-organization application footprint
- backups and restore validation are mandatory operational duties
- WAL mode is the operational default

---

## 11. System Responsibility Map

| Concern | Frontend | Backend | SQLite | MariaDB |
|---|---|---|---|---|
| login form | yes | yes | no | no |
| credential verification | no | orchestration | no | yes |
| session validity | no | yes | yes | no |
| role/permission enforcement | UI hint only | yes | source data | no |
| KPI mutation | UI submit only | yes | persist | no |
| import validation | preview display only | yes | job state | no |
| audit persistence | no | emit/orchestrate | yes | no |

---

## 12. Future Evolution Notes

intentionally deferred:

- multi-role users
- distributed scaling
- PostgreSQL migration
- advanced workflow engine
- fully dynamic schema builder
- real-time collaboration
- DAG or multi-parent KPI ownership hierarchy
- polymorphic ownership references such as `owner_type` / `owner_reference`
- expanded hierarchy vocabularies such as division, program, committee, or section-level ownership

---

## 13. Onboarding Guidance

recommended read order for new developers:

1. `docs/ARCHITECTURE.md`
2. `docs/MODULE_BOUNDARIES.md`
3. `docs/API_CONTRACT.md`
4. `docs/DOMAIN_MODEL.md`
5. `docs/AUTH_INTEGRATION.md`
6. `docs/SQLITE_SCHEMA.md`
7. `docs/SQLITE_OPERATIONS.md`

---

## 14. Definition of Done

เอกสารนี้ถือว่าเป็น canonical entry point เมื่อ:

- ทีมใหม่อ่านไฟล์เดียวแล้วเข้าใจหน้าที่ของระบบ ขอบเขตหลัก และ responsibility map
- เอกสารนี้ชี้ไปยังรายละเอียดของ spec อื่นได้โดยไม่ซ้ำ prose เกินจำเป็น
