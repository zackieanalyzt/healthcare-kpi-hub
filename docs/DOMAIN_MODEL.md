# healthcare-kpi-hub Domain Model

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering
**Primary References**:
- `docs/ARCHITECTURE_V2.md`
- `docs/IMPLEMENTATION_ROADMAP.md`
- `docs/SQLITE_SCHEMA.md`
- `docs/RBAC_MATRIX.md`
- `docs/IMPORT_SPEC.md`

---

## 1. Purpose

เอกสารนี้อธิบาย business semantics ของระบบ `healthcare-kpi-hub` แยกจาก schema เพื่อให้ทีมเข้าใจว่า entity ต่าง ๆ มีความหมายอย่างไร อยู่ใน workflow ไหน และมี invariants อะไรที่ห้ามละเมิด

---

## 2. Domain Principles

1. ระบบนี้เป็น operational KPI management system ก่อนจะเป็น dashboard platform
2. worklist คือ entry point หลักของผู้ใช้เชิงปฏิบัติการ
3. KPI model ใช้ hybrid configuration with guardrails ไม่ใช่ fully dynamic schema
4. authorization เป็น business control สำคัญ ไม่ใช่ concern เชิงเทคนิคอย่างเดียว
5. audit events ต้องสะท้อน business-significant actions ไม่ใช่แค่ low-level row changes

---

## 3. Aggregate Boundaries

aggregate หลักของระบบ:

- Identity and Access Aggregate
  - User
  - Role
  - Permission
  - Session

- Navigation Aggregate
  - Workgroup
  - Section
  - KPIPage

- KPI Definition Aggregate
  - KPIPage
  - KPIDefinition

- KPI Operations Aggregate
  - ReportingPeriod
  - KPIEntry
  - EntryValue

- Import Aggregate
  - ImportJob

- Audit Aggregate
  - AuditEvent

---

## 4. Entity Semantics

### 4.1 User

purpose:

- ตัวแทนผู้ใช้ของระบบใหม่ในระดับ application

ownership:

- profile identity พื้นฐาน derive จาก auth source
- role และ active state ในเชิงแอปเป็น ownership ของระบบใหม่

lifecycle:

- provisioned เมื่อ login สำเร็จครั้งแรก
- active ระหว่างได้รับอนุญาตให้ใช้ระบบ
- inactive เมื่อถูกปิดสิทธิ์ในแอป

business invariants:

- username ต้องไม่ซ้ำ
- inactive local user ใช้งานระบบไม่ได้แม้ credential ต้นทางถูกต้อง

additional frozen transition rules:

- `pending -> locked` is allowed
- `draft -> locked` is allowed
- `locked` has no ordinary outbound transition

audit relevance:

- create user
- activate/deactivate user
- role change

### 4.2 Role

purpose:

- นิยามระดับหน้าที่หลักของผู้ใช้ในระบบ

ownership:

- seed และ governance อยู่ที่ระบบใหม่

invariants:

- role code ต้อง stable
- role ต้อง map ไปยัง permissions อย่าง explicit

audit relevance:

- role assignment changes

### 4.3 Permission

purpose:

- หน่วยสิทธิ์ที่ละเอียดกว่าระดับ role

ownership:

- เป็น security contract ของระบบใหม่

invariants:

- permission code ต้อง unique และ stable
- endpoint และ screen สำคัญต้อง map ไปยัง permission

### 4.4 Session

purpose:

- หลักฐานการยืนยันตัวตนที่ active อยู่ของผู้ใช้

ownership:

- ระบบใหม่เป็นเจ้าของเต็มรูปแบบ

lifecycle:

- created on login success
- active until expiry, revoke, or logout
- revoked by security or admin action

invariants:

- หนึ่ง session ต้องผูกกับหนึ่ง user identity
- session token plaintext ต้องไม่ถูกเก็บใน DB

audit relevance:

- login success/failure
- logout
- session revoke

### 4.5 Workgroup

purpose:

- grouping ระดับบนสุดของ navigation และ ownership context เชิงงาน

ownership:

- จัดการโดย admin

lifecycle:

- active หรือ inactive

invariants:

- code ต้อง unique
- inactive workgroup ต้องไม่ถูกแสดงใน operational navigation ใหม่ แต่ historical data ยังอ้างได้

### 4.6 Section

purpose:

- หมวดงานภายใต้ workgroup

ownership:

- จัดการโดย admin ภายใต้ workgroup ที่มีอยู่

invariants:

- code ต้อง unique ภายใน workgroup เดียวกัน
- inactive section ไม่ควรถูกใช้สร้าง KPIPage ใหม่

### 4.7 KPIPage

purpose:

- พื้นที่แสดงและทำงานกับชุด KPI ที่เกี่ยวข้องกัน

ownership:

- จัดการโดย admin

operational relationship:

- ผู้ใช้เข้าถึง KPI operations ผ่าน page
- page เป็นบริบทสำคัญของ worklist deep-link
- page also represents a hierarchy-aware ownership node through separate hierarchy metadata
- hierarchy context and navigation grouping are related but not the same concern

invariants:

- page ต้องอยู่ใต้ section เดียว
- inactive page ไม่ควรรับ definition ใหม่หรือแสดงใน navigation ปกติ
- page hierarchy may have one parent page and zero-to-many child pages
- hierarchy levels are constrained to `organization`, `department`, `unit`, `individual`

### 4.8 KPIDefinition

purpose:

- นิยาม KPI แบบ template-driven ที่ระบุ code, name, unit, preset, และ rules พื้นฐาน
- acts as the template-level semantic definition for future operational KPI entries

ownership:

- จัดการโดย admin

operational relationship:

- definition เป็นต้นทางของ KPIEntry ในแต่ละ reporting period
- definition is not itself the operational reporting record for a period
- one definition may produce many period-specific entries over time
- imports should target operational entries and values while preserving lineage back to the originating definition
- dashboards should aggregate period results by operational entry data and may group by definition lineage

lifecycle:

- created โดย admin
- active เพื่อใช้งาน
- inactive เมื่อเลิกใช้เชิง future periods

business invariants:

- code ต้อง unique ภายใน page
- preset_code ต้องอยู่ใน allowed preset catalog
- ห้ามแก้ definition แบบทำลายความหมายของ historical entries โดยไม่มี controlled migration/versioning
- a definition must preserve stable KPI meaning across periods until a controlled versioning event replaces it

validation responsibility:

mutation note:

- `entry_values` must not be mutated directly outside the `kpi_entries` service boundary
- future imports should reuse the same service-layer validation and audit semantics as manual KPI updates

- admin input validation ใน API layer
- semantic guardrails ใน service layer

audit relevance:

- definition create/update/deactivate
- definition version replacement is semantically distinct from ordinary entry updates and must be audited as governance change

### 4.9 ReportingPeriod

purpose:

- นิยามรอบเวลาที่ KPI ถูกติดตามและอัปเดต

ownership:

- จัดการโดยระบบหรือ admin policy ระดับกลาง

lifecycle states:

- `planned`
- `open`
- `closed`
- `archived`

opening and closing:

- period ถูกสร้างล่วงหน้าได้ในสถานะ `planned`
- period เปิดใช้งานเมื่อถึงรอบการทำงานหรือเมื่อ admin เปิดอย่าง explicit
- period ปิดเมื่อพ้นช่วงรับอัปเดตหรือมี action ปิดงวด
- period archived เมื่อเก็บเพื่ออ้างอิงระยะยาว

business invariants:

- period_key ต้อง unique
- มีได้อย่างมากหนึ่ง period ต่อ key เดียว
- KPIEntry editable ได้เฉพาะเมื่อ period เป็น `open`

audit relevance:

- period opened
- period closed

### 4.10 KPIEntry

purpose:

- instance ของ KPIDefinition หนึ่งตัวใน ReportingPeriod หนึ่งงวด

when created:

- ต้องถูกสร้างเมื่อระบบต้องเตรียม operational work สำหรับ definition ที่ active ในงวดที่เปิด
- การสร้างทำได้สองรูปแบบ:
  - pre-generation เมื่อ period เปิด
  - on-demand generation ครั้งแรกที่ page/entry ถูกเรียกใช้งาน หากระบบเลือก lazy strategy

initial implementation recommendation:

- ใช้ pre-generation ตอน period เปิด เพื่อให้ worklist และ assignment มีสภาพข้อมูลแน่นอน

workflow states:

- `draft`
- `pending`
- `submitted`
- `locked`

editable rules:

- editable เมื่อ:
  - user มี `kpi.update`
  - reporting period เป็น `open`
  - entry status ไม่ใช่ `locked`
  - page/definition ที่เกี่ยวข้องยัง active สำหรับ operational use

- not editable เมื่อ:
  - period `closed` หรือ `archived`
  - entry ถูก `locked`
  - local account ไม่มีสิทธิ์

ownership:

- operationally owned by assigned staff
- governance owned by system and managers

actor matrix for first mutation implementation:

- `admin`: may update any KPI entry because the role includes `kpi.update`
- `manager`: may update any KPI entry because the role includes `kpi.update`
- `editor`: may update any KPI entry because the role includes `kpi.update`
- `viewer`: may not update KPI entries

actor policy notes:

- current mutation authorization is permission-based, not node-scoped
- assignment to the current user does not gate update permission in the first mutation release
- managers may update entries assigned to other users in the current phase
- future hierarchy-aware or assignee-only restrictions are deferred

first mutation implementation scope:

- allowed mutable fields:
  - `status`
  - `actual_value`
  - `progress_value`
  - `note`
- deferred mutable fields:
  - `assigned_to`
  - `due_at`
  - `target_value`
  - `extra_json`

mutation invariants:

- mutation requires optimistic concurrency comparison against current `updated_at`
- stale client state must be rejected before any business mutation is persisted
- value updates must still satisfy `KPIDefinition` preset and value-type rules
- locked entries must reject all ordinary mutation attempts
- inactive page or inactive definition blocks operational mutation even if historical reads are still allowed

business invariants:

- หนึ่ง definition ต่อหนึ่ง period มีได้หนึ่ง entry
- status transition ต้องเป็นไปตาม workflow policy
- due date และ assignment ต้องสอดคล้องกับการทำงานจริง ไม่ใช่ metadata ลอย
- KPIEntry is the period-scoped execution record and is the primary target for imports, worklist state, and operational audit

status transitions:

frozen transition table for the first mutation release:

- `draft -> pending`
- `pending -> submitted`
- `submitted -> pending` ได้หาก manager หรือ editor ที่มีสิทธิ์ส่งกลับ
- `submitted -> locked` เมื่อ period ปิดหรือ manager ล็อก
- `locked` เป็น terminal state สำหรับงวดนั้น ยกเว้น controlled administrative unlock

audit relevance:

- create entry
- update entry
- change status
- reassign ownership
- lock/unlock
- value update, submit, return, and lock must be distinguishable semantic audit events

### 4.11 EntryValue

purpose:

- payload ค่าของ KPIEntry

ownership:

- เปลี่ยนตามการอัปเดตของ KPIEntry

business invariants:

- ต้องสอดคล้องกับ preset/value type ของ KPIDefinition
- progress_value ถ้ามี ต้องอยู่ในช่วงที่ยอมรับได้
- note ไม่ใช่ที่เก็บข้อมูลโครงสร้างแทน schema

validation responsibility:

- shape validation ใน API layer
- preset-specific semantic validation ใน service layer

### 4.12 ImportJob

purpose:

- represent controlled ingestion attempt หนึ่งครั้ง

ownership:

- สร้างโดยผู้ใช้ที่มีสิทธิ์ import
- state ของ job ถูกขับเคลื่อนโดย import pipeline

lifecycle:

- `uploaded`
- `parsed`
- `validated`
- `ready_to_commit`
- `committed`
- `failed`

commit effect on domain state:

- import commit เป็น business-significant action
- เมื่อ commit สำเร็จ จะสร้างหรืออัปเดต KPIEntry/EntryValue ตาม mapping ที่ผ่าน validation
- ต้องสร้าง audit event และ import summary
- import commit ต้องไม่ปล่อยให้เกิด partial committed state แบบเงียบ

duplicate handling:

- แถวที่ชี้ไปยัง KPIEntry เดิมใน period เดิมถือเป็น update candidate ไม่ใช่ create ใหม่

audit relevance:

- upload file
- validation failed
- commit success
- commit rejected

### 4.13 AuditEvent

purpose:

- บันทึกเหตุการณ์ทางธุรกิจและความปลอดภัยที่มีนัยสำคัญ

business-significant examples:

- login success/failure
- role change
- user deactivate
- reporting period open/close
- KPI definition change
- KPI entry update
- KPI entry status change
- import commit
- navigation structure change

invariants:

- append-oriented
- ไม่ใช้เป็นแค่ debug log
- payload ต้องมีประโยชน์ต่อการตรวจสอบย้อนหลัง

---

## 5. Operational Workflow Relationships

flow หลักของระบบ:

1. user login สำเร็จ
2. user เข้าสู่ worklist
3. worklist อ้าง ReportingPeriod ปัจจุบันและ KPIEntry ที่ค้างงาน
4. user เปิด KPIPage
5. user แก้ไข KPIEntry และ EntryValue ตามสิทธิ์
6. manager หรือระบบเปลี่ยน status/lock ตามงวด
7. dashboard อ่านข้อมูลสรุปจาก KPIEntry ที่มีอยู่

planned mutation execution sequence:

1. client reads KPI entry detail and stores current `updated_at`
2. client submits a conservative patch request with allowed fields only
3. service validates permission, period openness, active page/definition, and entry lock state
4. service validates optimistic concurrency before any write
5. service updates `kpi_entries` and `entry_values` in one transaction
6. service emits semantic audit events in the same mutation flow
7. client refreshes the read model from persisted state

admin flow:

1. admin จัดการ navigation
2. admin จัดการ KPI definitions
3. system ใช้ definitions สร้าง KPIEntry สำหรับ period ใหม่

import flow:

1. importer upload file
2. system parse and validate
3. importer preview issues
4. importer commit
5. domain state ของ KPI entries ถูกเปลี่ยนแบบ controlled

---

## 6. Inactive Entity Behavior

- inactive `User`: login ไม่สำเร็จในระดับแอป
- inactive `Workgroup/Section/KPIPage`: ไม่แสดงใน navigation ปกติ แต่ historical references ยังคงใช้ได้
- inactive `KPIDefinition`: ไม่ใช้สร้าง future KPIEntry ใหม่ แต่ historical entries ไม่ถูกลบ
- inactive entity ทุกชนิดควรหลีกเลี่ยง hard delete หากยังมี historical dependencies

---

## 7. Validation Responsibility Model

- API layer:
  - shape validation
  - required fields
  - primitive constraints
  - enum syntax checks

- service layer:
  - authorization-sensitive validations
  - workflow state checks
  - period openness checks
  - preset-specific KPI rules
  - import commit invariants

- persistence layer:
  - uniqueness and relational integrity

---

## 8. Definition of Done

domain model นี้ถือว่า implementation-ready เมื่อ:

- entity purpose, lifecycle, invariants, และ workflow relationships ถูกระบุครบ
- ทีมสามารถตอบคำถามเชิง business semantics ได้โดยไม่เปิด schema document
- KPI operations, import commit, และ audit significance ถูกนิยามแบบไม่คลุมเครือ
