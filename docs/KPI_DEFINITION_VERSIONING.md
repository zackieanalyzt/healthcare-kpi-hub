# healthcare-kpi-hub KPI Definition Versioning Strategy

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering

---

## 1. Purpose

เอกสารนี้กำหนด policy สำหรับการเปลี่ยน KPIDefinition เพื่อป้องกัน historical KPI corruption และ silent reinterpretation ของข้อมูลย้อนหลัง

---

## 2. What Counts as Semantic Change

semantic change includes:

- unit change
- preset change
- value type change
- formula meaning change
- target/actual interpretation change
- progress/status interpretation change

---

## 3. Allowed Changes Without New Version

- display label clarification that does not change meaning
- description text improvement
- owner label wording refinement
- sort order change
- active/inactive flag for future use only

---

## 4. Forbidden Direct Changes

ห้ามแก้ทับ definition เดิมโดยตรงเมื่อกระทบ historical semantics เช่น:

- เปลี่ยน `%` เป็น absolute count
- เปลี่ยน preset จาก percentage เป็น milestone
- เปลี่ยนความหมายของ field ที่บันทึกไปแล้ว

---

## 5. Versioning Strategy

selected strategy:

- immutable semantic definition with clone-and-replace

justification:

- เรียบง่ายกว่า effective-date model
- ชัดเจนกว่าสำหรับ historical integrity
- ลดความเสี่ยงในการ reinterpret data เก่า

rule:

- หาก semantic change เกิดขึ้น ต้องสร้าง definition ใหม่
- definition เดิมถูกทำ inactive สำหรับ future periods
- future KPIEntry ใช้ definition ใหม่
- historical KPIEntry ยังคงอ้าง definition เดิม

---

## 6. Historical Integrity Rules

- historical KPI ต้องอ่านย้อนหลังได้ตรงความหมายเดิม
- dashboard historical aggregation ต้องไม่ reinterpret ค่าเก่าแบบเงียบ
- reporting across multiple periods ต้อง aware ว่า definition lineage อาจเปลี่ยน

---

## 7. Migration Policy

หากจำเป็นต้อง migrate KPI semantics:

1. create ADR
2. define migration scope and affected periods
3. create controlled data migration plan
4. record audit trail
5. validate dashboard/report impact before rollout

direct in-place semantic rewrite without migration plan is forbidden

---

## 8. Definition of Done

policy นี้ถือว่า foundation-ready เมื่อ:

- ทีมรู้ชัดว่าอะไรเปลี่ยนได้ตรง ๆ และอะไรต้อง version ใหม่
- historical KPI integrity ได้รับการปกป้องก่อนเริ่มทำ admin definition editing จริง
