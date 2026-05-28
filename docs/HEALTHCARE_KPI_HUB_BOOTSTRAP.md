# healthcare-kpi-hub Bootstrap Guide

**Purpose**: เอกสารตั้งต้นสำหรับ repo ใหม่ `healthcare-kpi-hub`  
**Date**: 2026-05-28  
**Depends on**: `ARCHITECTURE_V2.md`

---

## 1. Why This Document Exists

ไฟล์ `ARCHITECTURE_V2.md` เป็นเอกสารทิศทางระดับสถาปัตยกรรมและ product design สำหรับระบบรุ่นใหม่

แต่สำหรับการเริ่มต้น repo ใหม่จริง เราต้องการเอกสารที่เจาะจงกว่าใน 4 เรื่อง:

- repo นี้มีเป้าหมายอะไร
- อะไรจากโปรเจ็กต์เดิมที่ควรย้ายมาใช้
- อะไรจากโปรเจ็กต์เดิมที่ไม่ควรย้ายมา
- ควรเริ่ม implementation ลำดับไหน

ไฟล์นี้จึงทำหน้าที่เป็น **bridge document** ระหว่าง:

- `healthcare-kpi-dashboard` (legacy/reference)
- `healthcare-kpi-hub` (new canonical codebase)

---

## 2. Canonical Positioning

### Legacy Repository

`healthcare-kpi-dashboard`

บทบาท:

- historical implementation
- reference for business terminology
- reference for auth integration knowledge
- reference for sample data shape
- reference for legacy workflows

### New Repository

`healthcare-kpi-hub`

บทบาท:

- canonical v2 codebase
- clean architecture implementation
- new product model
- new UX and UI system
- SQLite-based application platform

---

## 3. Source of Truth Rules

เมื่อเริ่ม repo ใหม่ ให้ใช้กติกานี้:

### Primary Source of Truth

1. `docs/ARCHITECTURE_V2.md`
2. เอกสารใน repo ใหม่ `healthcare-kpi-hub/docs`
3. โค้ดใน repo ใหม่

### Secondary Reference Only

ใช้จาก repo เดิมได้เฉพาะเพื่ออ้างอิง:

- domain vocabulary
- old feature inventory
- MariaDB auth behavior
- sample KPI structures
- admin use cases

### Not Source of Truth

สิ่งเหล่านี้ใน repo เดิมไม่ควรถูกถือเป็นข้อบังคับสำหรับ v2:

- routing structure เดิม
- PostgreSQL schema เดิม
- dynamic schema model เดิม
- UI layout เดิม
- permission implementation เดิม
- state management pattern เดิม

---

## 4. What To Carry Forward

สิ่งที่ควรนำจากโปรเจ็กต์เดิมไปใช้ต่อ:

### Domain / Business Concepts

- workgroup / section / KPI page
- KPI reporting periods
- operational update workflow
- auditability requirements
- admin-managed navigation

### External Integration Knowledge

- MariaDB HR authentication source
- personnel table assumptions
- existing login expectations

### Product Capabilities Worth Preserving

- KPI update workflow
- dashboard summaries
- import workflow
- admin configuration area
- role-based access

### Documentation Direction

- ใช้แนว product + architecture docs แบบแยกชั้น
- ตัดเอกสารที่ drift ง่ายออกจาก “source of truth”

---

## 5. What Must Not Be Carried Forward As-Is

สิ่งที่ไม่ควร copy ตรงจาก repo เดิม:

### Backend

- giant manual router in one file
- route-to-query coupling
- PostgreSQL-first schema assumptions
- trigger-heavy audit strategy
- permission drift between docs and code

### Frontend

- `App.jsx` as the main orchestration container
- business logic mixed with layout logic
- admin and operational UX in the same mental flow
- schema-driven UI that leaks data structure complexity to users

### Data Model

- free-form dynamic KPI table design
- inconsistent tab/content ownership rules
- loosely governed JSONB-centered persistence model

---

## 6. Initial Product Definition for healthcare-kpi-hub

### Product Statement

`healthcare-kpi-hub` คือระบบ KPI สำหรับหน่วยงานสาธารณสุขที่เน้นการอัปเดตข้อมูล, การติดตามงานค้าง, การดูภาพรวมผลการดำเนินงาน, และการบริหารโครงสร้างระบบอย่างปลอดภัย

### Product Mode

ไม่ใช่ generic platform เต็มรูปแบบใน phase แรก  
แต่เป็น:

- operational KPI management system
- dashboard and reporting support tool
- admin-configurable system with guardrails

### UX Priority

1. Worklist
2. KPI update flow
3. Dashboard
4. Admin configuration
5. Import tools

---

## 7. Technical Baseline for the New Repo

### Required Stack

- Frontend: React + Vite + TypeScript
- Backend: Bun + TypeScript
- App DB: SQLite
- Auth Source: MariaDB
- Styling: modern design system with clear tokens

### Recommended Additions

- schema validation layer
- migration tool for SQLite
- test framework from day one
- typed API contracts

### Deliberate Constraints

- no PostgreSQL dependency
- no fully dynamic schema builder in phase 1
- no mixed legacy compatibility inside the core domain model

---

## 8. Suggested Repository Layout

```text
healthcare-kpi-hub/
  docs/
  apps/
    web/
    api/
  packages/
    shared-types/
    ui/
    config/
  scripts/
  .github/
```

### Why This Layout

- แยก app concerns ชัด
- รองรับ shared types และ UI primitives
- scaling ได้ดีกว่า flat single-app structure

ถ้าต้องการเริ่มง่ายกว่านี้ อาจเริ่มแบบ:

```text
healthcare-kpi-hub/
  docs/
  frontend/
  backend/
```

แล้วค่อยย้ายเป็น monorepo structure ภายหลัง

---

## 9. First Implementation Milestones

### Milestone 1: Repo Foundation

- initialize repo
- setup frontend/backend
- setup TypeScript
- setup linting/formatting
- setup docs structure
- add environment examples

### Milestone 2: Auth and App Shell

- MariaDB auth bridge
- SQLite user/session tables
- login/logout/me
- frontend app shell
- protected routes

### Milestone 3: Navigation + Worklist

- workgroup/section/page model
- navigation APIs
- worklist home screen
- current period awareness

### Milestone 4: KPI Core

- KPI definition model
- KPI entry model
- KPI page UI
- update flow
- audit event creation

### Milestone 5: Admin + Import

- admin navigation management
- KPI definition management
- import wizard
- audit viewer

---

## 10. Legacy-to-New Mapping

| Legacy Concern | New Repo Strategy |
|---|---|
| PostgreSQL app data | Replace with SQLite |
| MariaDB auth | Keep |
| Manual route matching | Replace with modular route/controller structure |
| Dynamic table schemas | Replace with hybrid config model |
| App-wide state in `App.jsx` | Replace with route/feature-based composition |
| Trigger-led audit | Replace with service-led audit events |
| Dashboard-first feeling | Replace with worklist-first UX |

---

## 11. New Docs To Create In healthcare-kpi-hub/docs

เมื่อเปิด repo ใหม่ ให้มีเอกสารชุดนี้ตั้งแต่ต้น:

1. `README.md`
2. `PRODUCT_SCOPE.md`
3. `ARCHITECTURE.md`
4. `DOMAIN_MODEL.md`
5. `SQLITE_SCHEMA.md`
6. `API_CONTRACT.md`
7. `AUTH_INTEGRATION.md`
8. `IMPLEMENTATION_ROADMAP.md`
9. `DECISIONS.md`

### Minimum Day-One Docs

ถ้าจะเริ่มแบบ lean:

1. `README.md`
2. `ARCHITECTURE.md`
3. `IMPLEMENTATION_ROADMAP.md`
4. `AUTH_INTEGRATION.md`

---

## 12. Recommended README Description

Repository name:

`healthcare-kpi-hub`

Suggested description:

`Next-generation healthcare KPI platform built with Bun, React, SQLite, and MariaDB authentication.`

---

## 13. Working Agreement For Future Chats

เมื่อเริ่มแชตใหม่สำหรับ repo `healthcare-kpi-hub` ให้ถือข้อตกลงนี้:

- ใช้ `ARCHITECTURE_V2.md` เป็น architecture parent document
- ใช้ไฟล์นี้เป็น migration/bootstrap context
- ตีความ repo เดิมเป็น reference เท่านั้น
- ไม่พยายาม preserve implementation เดิมโดยอัตโนมัติ
- prioritize clean architecture and operator UX over backward familiarity

---

## 14. Final Recommendation

สำหรับการเริ่มต้น repo ใหม่:

- ใช้ `ARCHITECTURE_V2.md` เป็นเอกสารหลักเชิงวิสัยทัศน์
- ใช้ไฟล์นี้เป็นเอกสารตั้งต้นเชิงปฏิบัติ

สรุปคือ:

- `ARCHITECTURE_V2.md` = why + what
- `HEALTHCARE_KPI_HUB_BOOTSTRAP.md` = how to start cleanly

