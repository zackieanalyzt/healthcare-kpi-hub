# healthcare-kpi-hub Engineering Working Agreement

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering

---

## 1. Purpose

เอกสารนี้กำหนดข้อตกลงการทำงานร่วมกันของทีมพัฒนา เพื่อให้การพัฒนาระบบใหม่คงคุณภาพ ลด drift และรองรับการดูแลต่อได้จริง

---

## 2. Branch Strategy

- default integration branch: `main`
- feature branches ใช้ prefix `feature/`
- docs-only branches ใช้ prefix `docs/`
- fix branches ใช้ prefix `fix/`
- ห้าม push implementation ที่มีผลต่อ feature สำคัญตรงเข้า `main`

---

## 3. Pull Request Rules

- PR ต้องมี scope ชัดเจน
- PR ต้องอธิบายผลกระทบต่อ architecture, schema, auth, หรือ UX หากมี
- PR ขนาดใหญ่ควรถูกแยกเป็นหลาย PR เมื่อทำได้
- PR ที่เปลี่ยน contract หรือ policy ต้องอัปเดต docs ก่อนหรือพร้อมกัน

---

## 4. Review Expectations

- reviewer ต้องตรวจ correctness, maintainability, security, และ drift risk
- งานที่กระทบ auth, RBAC, schema, import, หรือ audit ต้องมี review เชิง policy ไม่ใช่แค่ syntax
- หาก implementation ขัดกับ docs ต้องหยุดและแก้ docs หรือแก้ code ก่อน merge

---

## 5. Documentation Update Requirements

ต้องอัปเดต docs ที่เกี่ยวข้องเมื่อมีการเปลี่ยน:

- API contract
- domain semantics
- RBAC
- auth policy
- schema
- import behavior
- frontend flow

chat history ไม่ถือเป็น source of truth

---

## 6. Test Expectations

ขั้นต่ำก่อน merge:

- lint ผ่าน
- type check ผ่าน
- relevant tests ผ่าน

expected test layers:

- unit tests สำหรับ domain/service logic
- integration tests สำหรับ API และ persistence
- contract tests สำหรับ critical endpoints
- critical UI flow tests สำหรับ login, worklist, KPI update, import

---

## 7. Migration Review Policy

- schema changes ต้องผ่าน migration review
- migration ต้อง deterministic
- destructive migration ต้องมี explicit rationale
- seed changes ที่กระทบ permission หรือ enum-like values ต้อง review ร่วมกับ security/domain owner

---

## 8. Security Review Expectations

ต้องมี focused security review สำหรับการเปลี่ยนแปลงที่กระทบ:

- authentication
- authorization
- session
- import handling
- audit visibility
- secrets/config

deny-by-default เป็น baseline

---

## 9. Dependency Governance

- เพิ่ม dependency ใหม่ต้องมีเหตุผลชัดเจน
- หลีกเลี่ยง library ที่เพิ่ม hidden complexity ให้ auth, schema, หรือ import flow
- dependencies ที่กระทบ security surface ต้องผ่าน review เพิ่ม

---

## 10. Release Readiness Baseline

ก่อน release ที่มี feature สำคัญ:

- docs สำคัญต้องเป็นปัจจุบัน
- auth policy และ RBAC ต้องตรงกับ implementation
- migrations ต้องทดสอบได้
- backup/restore baseline ต้องพร้อม
- critical flows ต้องผ่าน test baseline

---

## 11. Definition of Done

working agreement นี้ถือว่าใช้งานได้เมื่อ:

- ทีมสามารถใช้อ้างอิงในการเปิด branch, ส่ง PR, review, และตัดสินใจเรื่อง docs/test/security ได้จริง
