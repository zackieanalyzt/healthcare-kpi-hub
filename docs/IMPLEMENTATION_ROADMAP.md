# healthcare-kpi-hub Implementation Roadmap

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering
**Primary References**:
- `docs/ARCHITECTURE_V2.md`
- `docs/HEALTHCARE_KPI_HUB_BOOTSTRAP.md`

---

## 1. Purpose

เอกสารนี้กำหนดแผนการพัฒนา `healthcare-kpi-hub` แบบเป็นเฟสและ milestone โดยยึดหลักจาก `ARCHITECTURE_V2.md` และ `HEALTHCARE_KPI_HUB_BOOTSTRAP.md` เพื่อให้ทีมพัฒนาทำงานได้อย่างเป็นระบบ ตรวจรับได้ และลดความเสี่ยงจากการตีความสถาปัตยกรรมไม่ตรงกัน

เอกสารนี้มีเป้าหมายเพื่อ:

- กำหนดลำดับการพัฒนาที่เหมาะสม
- กำหนด deliverables ที่ตรวจสอบได้ในแต่ละเฟส
- กำหนด definition of done สำหรับการรับมอบงาน
- ลด product drift, architecture drift, และ security drift
- ใช้เป็น baseline สำหรับ planning, review, และ release readiness

---

## 2. Roadmap Principles

การดำเนินงานทั้งหมดใน roadmap นี้ต้องยึดหลักดังต่อไปนี้:

1. **Architecture First**
   เริ่มจากการล็อกกรอบสถาปัตยกรรม เอกสาร มาตรฐาน และขอบเขตก่อนลง implementation เชิง feature

2. **Security by Design**
   ความปลอดภัยต้องถูกฝังตั้งแต่การออกแบบ auth, session, authorization, validation, import, logging, และ deployment baseline

3. **Worklist First**
   ลำดับการพัฒนาต้องสะท้อน UX หลักของระบบ คือ operational workflow ไม่ใช่ dashboard-first

4. **Deliver Thin Vertical Slices**
   แต่ละ milestone ควรจบเป็นชิ้นงานที่เชื่อมโยงตั้งแต่ domain, API, UI, security, และ test baseline ได้จริง แม้จะยังไม่ครบทุกฟีเจอร์

5. **Guardrails over Flexibility**
   v2 ต้องหลีกเลี่ยงการเปิดความยืดหยุ่นเกินจำเป็น เช่น fully dynamic schema หรือ admin-driven structures ที่ไม่มี governance

6. **New Repo is Canonical**
   โค้ดและเอกสารใน repo นี้คือแหล่งอ้างอิงหลัก ส่วน legacy system ใช้เพียงเพื่ออ้างอิง vocabulary, auth behavior, และข้อมูลตัวอย่าง

---

## 3. Planning Assumptions

assumptions สำหรับ roadmap นี้:

- ระบบนี้เป็น v2 rewrite ไม่ใช่ 1:1 migration จากระบบเดิม
- application database คือ SQLite
- authentication source คือ MariaDB เดิม
- authorization, session, audit, และ application state อยู่ในระบบใหม่
- initial scope เน้น operational KPI management, dashboard summary, admin configuration, และ import workflow
- initial phase ไม่รองรับ fully dynamic schema builder
- migration ข้อมูลเก่าจะถูกจัดการแบบ controlled import ภายหลัง ไม่ใช่ dependency สำหรับการเริ่มพัฒนา core architecture

หาก assumptions เหล่านี้เปลี่ยน ต้องบันทึกผ่าน decision record ก่อนปรับ roadmap

---

## 4. Delivery Model

roadmap นี้แบ่งเป็น 7 เฟส:

1. Phase 0: Governance and Foundation Planning
2. Phase 1: Repository and Engineering Baseline
3. Phase 2: Identity, Session, and Access Control
4. Phase 3: Core Domain and Data Platform
5. Phase 4: Navigation and Worklist Experience
6. Phase 5: KPI Operations Core
7. Phase 6: Admin, Import, Audit, and Release Readiness

แต่ละเฟสมี:

- objective
- scope
- key deliverables
- milestones
- dependencies
- risks
- definition of done

---

## 5. Phase 0: Governance and Foundation Planning

### Objective

ทำให้ทีมมีกรอบอ้างอิงเดียวกันด้าน product, architecture, delivery, security, และ documentation ก่อนเริ่มงานเชิงเทคนิค

### Scope

- ยืนยัน source of truth ของเอกสาร
- แตก architecture vision ออกเป็นเอกสารปฏิบัติการ
- กำหนดมาตรฐานการพัฒนาและการตรวจรับ
- จัดลำดับ feature และ non-functional priorities
- กำหนด decision-making process

### Key Deliverables

- `docs/IMPLEMENTATION_ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/AUTH_INTEGRATION.md`
- `docs/API_CONTRACT.md` ฉบับ outline
- `docs/SQLITE_SCHEMA.md` ฉบับ outline
- `docs/DECISIONS.md`
- engineering working agreement
- security baseline checklist

### Milestones

#### M0.1 Architecture Alignment

ยืนยันร่วมกันว่า:

- `ARCHITECTURE_V2.md` เป็น architecture parent document
- `HEALTHCARE_KPI_HUB_BOOTSTRAP.md` เป็น bootstrap context
- repo เดิมไม่ใช่ source of truth เชิง implementation

#### M0.2 Delivery Governance Baseline

กำหนด:

- branch and PR workflow
- review expectations
- documentation update policy
- testing policy
- definition of done template

#### M0.3 Security Baseline Agreement

กำหนด baseline ขั้นต่ำสำหรับ:

- auth and session security
- RBAC
- input validation
- audit logging
- secret handling
- dependency governance

### Dependencies

- การยืนยัน stakeholder ว่าทิศทาง v2 rewrite เป็นแนวทางหลัก

### Risks

- เริ่ม implementation ก่อนล็อกเอกสารหลัก
- ใช้แนวคิดจาก legacy implementation โดยไม่มีการกลั่นกรอง
- feature creep ตั้งแต่ phase แรก

### Definition of Done

- มีเอกสาร roadmap และเอกสารหลักที่จำเป็นสำหรับเริ่มพัฒนา
- มี working agreement ที่ทีมสามารถใช้ review งานได้จริง
- มี security baseline ระดับโครงการที่ชัดเจน
- มีรายการ open decisions ที่ยังต้องตามต่อ โดยไม่มี ambiguity เชิงสถาปัตยกรรมระดับวิกฤต

---

## 6. Phase 1: Repository and Engineering Baseline

### Objective

สร้างฐาน repo และมาตรฐานทางวิศวกรรมซอฟต์แวร์เพื่อรองรับการพัฒนาระยะยาวอย่างมีวินัย

### Scope

- กำหนด repository layout
- ตั้ง frontend/backend/shared package boundaries
- ตั้ง TypeScript baseline
- ตั้ง linting, formatting, testing, และ CI baseline
- ตั้ง environment configuration conventions
- ตั้ง dependency governance baseline

### Key Deliverables

- repository structure ที่อนุมัติแล้ว
- TypeScript configuration strategy
- lint and format standards
- test strategy เริ่มต้น
- CI quality gates
- `.env.example` policy
- dependency review checklist

### Milestones

#### M1.1 Repository Structure Locked

เลือกระหว่าง:

- monorepo-ready structure
- simplified initial structure ที่ย้ายต่อได้ง่าย

โดยต้องมีเหตุผลรองรับและบันทึกไว้

#### M1.2 Engineering Quality Baseline

กำหนดมาตรฐานขั้นต่ำของ:

- lint
- format
- type checking
- test commands
- CI checks

#### M1.3 Configuration and Environment Baseline

กำหนดมาตรฐานสำหรับ:

- local development environment
- app config separation
- secret handling rules
- environment variable naming

### Dependencies

- Phase 0 เอกสารหลักและ governance baseline

### Risks

- repo layout ไม่สะท้อน architecture boundaries
- shared package ถูกออกแบบเร็วเกินจนซับซ้อน
- CI มีแต่เชิง syntax แต่ไม่ป้องกัน drift จริง

### Definition of Done

- โครงสร้าง repo สอดคล้องกับ architecture target
- engineering baseline ถูกกำหนดและสื่อสารชัดเจน
- quality gates ขั้นต่ำถูกกำหนดครบในระดับ lint, type, test, และ dependency hygiene
- วิธีจัดการ config และ secret ชัดเจนและไม่เปิดช่องให้ hardcode credential

---

## 7. Phase 2: Identity, Session, and Access Control

### Objective

วางรากฐาน identity และ access control ที่ปลอดภัยและเป็นมาตรฐานก่อนขยายไปยัง feature อื่น

### Scope

- MariaDB authentication bridge
- user profile sync จาก auth source เข้าสู่ SQLite
- session lifecycle
- role and permission model
- protected API and route behavior
- login/logout/me contract

### Key Deliverables

- auth flow specification
- session model specification
- RBAC matrix
- permission naming standard
- auth threat model เบื้องต้น
- audit event requirements for auth events

### Milestones

#### M2.1 Authentication Contract Finalized

กำหนดชัดเจนว่า:

- backend จะตรวจ credential กับ MariaDB อย่างไร
- จะ sync profile อะไรเข้าระบบใหม่บ้าง
- failure modes และ error handling เป็นอย่างไร

#### M2.2 Session Security Baseline Finalized

กำหนด:

- session storage model
- token hashing strategy
- cookie policy
- expiry and idle timeout
- logout and revocation behavior

#### M2.3 Authorization Model Finalized

กำหนด:

- roles เริ่มต้น
- permissions เริ่มต้น
- authorization enforcement points
- policy ownership ระหว่าง route, service, และ domain

### Dependencies

- Phase 1 engineering baseline
- ความเข้าใจพฤติกรรม auth จากระบบเดิมในระดับ business-relevant

### Risks

- auth integration behavior ไม่ถูกบันทึกเป็นเอกสาร
- permission model drift ระหว่าง doc, API, และ implementation
- session security ถูกลดทอนเพื่อความสะดวกในการพัฒนา

### Definition of Done

- auth flow ตั้งแต่ login ถึง session validation ถูกกำหนดครบ
- role/permission model ถูกกำหนดแบบ explicit และตรวจสอบได้
- มีข้อกำหนดด้าน security สำหรับ auth, session, และ authorization ครบถ้วน
- auth-related audit events และ failure handling ถูกกำหนดไว้แล้ว

---

## 8. Phase 3: Core Domain and Data Platform

### Objective

ทำให้ domain model และ SQLite data model มีความชัดเจน เสถียร และพร้อมรองรับ feature หลักของระบบ

### Scope

- core domain entities
- navigation model
- KPI definition model
- reporting period model
- KPI entry/value model
- audit model
- import job model
- migration and seed strategy

### Key Deliverables

- `docs/DOMAIN_MODEL.md`
- `docs/SQLITE_SCHEMA.md`
- migration strategy document
- seed data strategy
- naming conventions for entities and identifiers
- data lifecycle rules

### Milestones

#### M3.1 Domain Model Finalized

กำหนด entity boundaries และความสัมพันธ์ของ:

- user, role, permission, session
- workgroup, section, kpi page
- kpi definition, reporting period, kpi entry, entry value
- import job, audit event

#### M3.2 Schema Design Finalized

กำหนด:

- table design
- constraints
- uniqueness rules
- indexing strategy
- timestamp conventions
- ID strategy

#### M3.3 Migration and Seed Baseline Finalized

กำหนด:

- migration ownership
- deterministic migration rules
- seed data categories
- master data update process

### Dependencies

- Phase 2 auth and authorization model

### Risks

- schema ถูกดึงกลับไปสู่ dynamic model เดิม
- ใช้ JSON field เกินจำเป็นจนทำลาย domain clarity
- constraints ไม่ถูกกำหนดตั้งแต่ต้น ทำให้ data quality drift

### Definition of Done

- domain model และ schema model สอดคล้องกับ architecture v2
- relational boundaries ชัด และใช้ flexible fields เท่าที่จำเป็น
- migration และ seed approach ถูกกำหนดแบบ deterministic
- schema รองรับ worklist-first product model ได้จริง

---

## 9. Phase 4: Navigation and Worklist Experience

### Objective

ออกแบบและล็อก vertical slice แรกของ product experience โดยเน้น navigation และ worklist เป็น entry point หลักของผู้ใช้

### Scope

- information architecture
- navigation behavior
- worklist home model
- current period awareness
- page access rules
- UX/state expectations สำหรับ operational user

### Key Deliverables

- frontend IA and screen map
- worklist functional specification
- navigation API contract
- access rules by role
- UX acceptance criteria สำหรับ worklist

### Milestones

#### M4.1 Information Architecture Finalized

กำหนดโครงสร้างการเข้าถึง:

- workgroup
- section
- KPI page
- admin area separation

#### M4.2 Worklist Definition Finalized

กำหนดว่า worklist ต้องแสดง:

- pending KPI
- overdue KPI
- assigned KPI
- recently updated KPI
- shortcuts ไปยัง KPI page ที่ใช้งานบ่อย

#### M4.3 Operational UX Rules Finalized

กำหนด UX rules ที่ enforce ได้ เช่น:

- user ไม่ต้องเข้าใจ schema ก่อนใช้งาน
- validation message ต้อง actionable
- operational path ต้องสั้นกว่า admin path

### Dependencies

- Phase 3 domain and schema clarity

### Risks

- dashboard กลับมาเป็นศูนย์กลาง UX
- navigation ถูกออกแบบตาม technical structure แทนงานของผู้ใช้
- admin concerns ปะปนกับ operational workflow

### Definition of Done

- information architecture สะท้อน product vision v2
- worklist ถูกนิยามเป็น home experience อย่างชัดเจน
- admin และ operational UX ถูกแยกจากกันทั้งเชิงหน้าที่และ mental model
- acceptance criteria ของ navigation/worklist พร้อมสำหรับ implementation

---

## 10. Phase 5: KPI Operations Core

### Objective

ล็อกข้อกำหนดของฟีเจอร์แกนกลางสำหรับการอัปเดต KPI และการติดตามผลในแต่ละรอบรายงาน

### Scope

- KPI definition guardrails
- KPI page behavior
- KPI entry update flow
- reporting period interactions
- validation rules
- change history expectations
- dashboard summary requirements ที่พึ่งพา KPI operations

### Key Deliverables

- KPI definitions specification
- KPI entry/update specification
- validation rules catalog
- KPI page API contract
- dashboard summary data contract ฉบับเริ่มต้น
- audit event mapping สำหรับ KPI operations

### Milestones

#### M5.1 KPI Definition Model Finalized

กำหนด:

- field presets ที่รองรับ
- metadata ที่บังคับใช้
- owner/due/status conventions
- guardrails สำหรับ admin configuration

#### M5.2 KPI Update Flow Finalized

กำหนด:

- การเปิดดู KPI page
- การเลือก period
- การอัปเดตค่า KPI
- การแสดง validation errors
- การแสดง change history

#### M5.3 KPI-to-Dashboard Data Contract Finalized

กำหนดข้อมูลขั้นต่ำที่ dashboard และ summary ต้องอ่านได้จาก KPI operational data

### Dependencies

- Phase 4 navigation and worklist definition

### Risks

- KPI model กลับไปเปิด dynamic flexibility เกินควบคุม
- validation rules กระจัดกระจายจนไม่สามารถ enforce กลางได้
- dashboard requirements ดึง domain model ให้ซับซ้อนเกิน operational needs

### Definition of Done

- KPI operational flow ถูกนิยามครบตั้งแต่ definition ถึง update
- validation และ business rules ถูกบันทึกแบบตรวจสอบได้
- KPI model ยังคง guardrails ตาม architecture v2
- dashboard summary requirements ไม่ขัดกับ worklist-first direction

---

## 11. Phase 6: Admin, Import, Audit, and Release Readiness

### Objective

ทำให้ระบบพร้อมใช้งานจริงในเชิงการบริหารจัดการ การนำเข้าข้อมูล การตรวจสอบย้อนหลัง และการเตรียมความพร้อมก่อนปล่อยใช้งาน

### Scope

- admin configuration areas
- import wizard workflow
- audit viewer requirements
- observability expectations
- reliability and recovery expectations
- go-live readiness criteria

### Key Deliverables

- admin functional specification
- import specification
- audit and logging specification
- release readiness checklist
- operational support checklist
- backup and recovery baseline

### Milestones

#### M6.1 Admin Control Surface Finalized

กำหนดขอบเขตของ admin area:

- navigation management
- KPI definition management
- user and role management
- import center
- audit viewer

#### M6.2 Import Workflow Finalized

กำหนดขั้นตอน:

- upload
- parse
- map
- preview
- validation review
- commit
- post-import summary and audit

รวมถึงข้อกำหนดด้านความปลอดภัยของไฟล์นำเข้า

#### M6.3 Audit and Observability Finalized

กำหนด:

- audit event taxonomy
- request/auth/error/import logs
- retention considerations
- sensitive data handling in logs

#### M6.4 Release Readiness Gate Finalized

กำหนดเกณฑ์สำหรับ:

- security review
- functional readiness
- test coverage of critical flows
- migration readiness
- backup and restore readiness
- rollback and incident response expectations

### Dependencies

- Phase 5 KPI operational specification

### Risks

- import ถูกมองเป็นแค่ parsing problem แทนที่จะเป็น controlled data ingestion flow
- audit log เก็บมากเกินจนเสี่ยงข้อมูลอ่อนไหว หรือเก็บน้อยเกินจนตรวจสอบไม่ได้
- release readiness ไม่มีเกณฑ์ชัดเจน ทำให้ go-live เสี่ยง

### Definition of Done

- admin, import, audit, และ observability requirements ครบและเชื่อมกัน
- import workflow มี guardrails ทั้งด้าน data quality และ security
- release readiness ถูกกำหนดเป็นเกณฑ์ตรวจรับ ไม่ใช่ความรู้สึก
- ระบบมี baseline สำหรับ backup, recovery, และ operational support

---

## 12. Cross-Phase Non-Functional Gates

ข้อกำหนดต่อไปนี้ต้องถูกตรวจในทุกเฟสที่เกี่ยวข้อง:

### Security Gates

- ไม่มี requirement ใดที่บังคับให้เก็บ secret หรือ token แบบ plaintext
- มี validation strategy สำหรับทุก mutation path
- authorization responsibility ชัดเจนและ centralized
- การจัดการ import, logs, และ audit ไม่เปิดเผยข้อมูลอ่อนไหวเกินจำเป็น

### Quality Gates

- เอกสารสอดคล้องกับ architecture parent document
- terminology ใช้สม่ำเสมอทั้ง docs
- มี acceptance criteria สำหรับ milestone สำคัญ
- open questions และ deferred decisions ถูกบันทึก ไม่ปล่อยค้างแบบ implicit

### Architecture Gates

- ไม่มีการย้อนกลับไปใช้ giant controller/router หรือ mixed concerns
- backend และ frontend boundaries ชัดเจน
- schema ไม่ drift ไปเป็น fully dynamic model
- admin flow ไม่ปะปนกับ operational flow

### Delivery Gates

- แต่ละ milestone มี owner และ output ที่ตรวจรับได้
- dependencies ระหว่าง milestone ชัดเจน
- ความเสี่ยงสำคัญถูกบันทึกและมี mitigation direction

---

## 13. Priority Order for Execution

ลำดับการทำงานที่แนะนำ:

1. Finalize governance and architecture-operational documents
2. Finalize auth and access control specification
3. Finalize domain model and SQLite schema specification
4. Finalize navigation and worklist specification
5. Finalize KPI operational specification
6. Finalize admin, import, audit, and release readiness specification
7. Start implementation only after the above artifacts are sufficiently stable

หลักสำคัญคือไม่เริ่มเขียนระบบเชิง feature ก่อนที่ auth, domain, และ worklist model จะชัด

---

## 14. Milestone Readiness Checklist

ก่อนปิด milestone ใด milestone หนึ่ง ต้องตอบคำถามเหล่านี้ได้ครบ:

1. เป้าหมายของ milestone นี้ถูกนิยามชัดหรือยัง
2. deliverables มี owner และมีรูปแบบผลลัพธ์ที่ตรวจรับได้หรือยัง
3. dependencies ถูกเคลียร์แล้วหรือยัง
4. security implications ถูกพิจารณาแล้วหรือยัง
5. architecture boundaries ยังถูกรักษาอยู่หรือยัง
6. มี open questions ที่กระทบ milestone ถัดไปหรือไม่
7. สิ่งที่สรุปได้ถูกบันทึกไว้ในเอกสาร source of truth แล้วหรือยัง

---

## 15. Definition of Done Template

definition of done สำหรับทุก milestone ควรมีองค์ประกอบอย่างน้อยดังนี้:

- ขอบเขตงานถูกทำครบตามที่ระบุ
- เอกสารที่เกี่ยวข้องถูกอัปเดตครบ
- terminology และ assumptions ไม่ขัดกับ architecture v2
- security concerns ที่เกี่ยวข้องถูกระบุและมีคำตอบ
- acceptance criteria ถูกนิยามแบบตรวจสอบได้
- ไม่มี critical ambiguity ที่จะทำให้ implementation ตีความแตกต่างกัน

---

## 16. Out of Scope for This Roadmap

roadmap ฉบับนี้ยังไม่ลงรายละเอียด:

- task breakdown ระดับรายวัน
- sprint estimation
- staffing plan รายบุคคล
- implementation ticket list
- code structure รายไฟล์
- deployment topology ระดับ production environment detail

สิ่งเหล่านี้ควรถูกแตกต่อหลังจากเอกสารระดับ roadmap และ architecture-operational docs มีเสถียรภาพแล้ว

---

## 17. Final Recommendation

แนวทางที่เหมาะสมที่สุดสำหรับ `healthcare-kpi-hub` คือการเดินงานแบบ:

- architecture-first
- security-by-design
- worklist-first delivery
- documentation-led alignment
- milestone-based acceptance

หากทีมรักษาวินัยตาม roadmap นี้ ระบบ v2 จะมีโอกาสสูงที่จะ:

- ลดความซับซ้อนจากระบบเดิม
- คุม product drift ได้ดีขึ้น
- ขยายฟีเจอร์ได้อย่างปลอดภัย
- ตรวจรับงานและ review งานได้เป็นระบบ
- พร้อมต่อยอดไปสู่ implementation โดยไม่เสียหลักสถาปัตยกรรม
