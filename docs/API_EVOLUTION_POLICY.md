# healthcare-kpi-hub API Evolution Policy

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering

---

## 1. Purpose

เอกสารนี้กำหนดกติกาการเปลี่ยนแปลง API เพื่อรักษา contract stability ขณะระบบพัฒนา

---

## 2. Backward Compatibility Rules

- response field ใหม่เพิ่มได้ หากเป็น optional หรือ nullable-safe
- ห้ามลบ field ที่ client ใช้อยู่โดยไม่มี deprecation process
- nullable handling ต้อง explicit; field ที่เคย non-null ห้ามเปลี่ยนเป็น missing แบบเงียบ
- optional request field เพิ่มได้ ถ้า default behavior ชัดเจน

### Enum Evolution Policy

- สามารถเพิ่ม enum value ใหม่ได้เมื่อ:
  - backend พร้อมรองรับ
  - frontend ที่อ่าน field นั้น handle unknown values safely
- ห้ามลบ enum value โดยไม่มี migration/deprecation plan

---

## 3. Breaking Change Rules

breaking change includes:

- removing response fields
- renaming fields
- changing field type
- changing field nullability semantics
- making optional field required
- changing status code semantics
- changing enum interpretation
- changing pagination shape

### Deprecation Process

1. document planned change
2. mark field/endpoint behavior as deprecated in docs
3. communicate downstream impact
4. remove only in planned breaking window

---

## 4. Error Contract Stability

- error envelope must remain consistent system-wide
- error codes are stable contract elements
- validation details must remain array-of-field-issues shape
- message text may evolve for clarity, but code semantics must remain stable

---

## 5. Pagination Stability

- pagination metadata stays under `meta.pagination`
- `page`, `page_size`, `total_items`, `total_pages` are required for page-based endpoints
- future cursor pagination may be introduced only as additive opt-in strategy

### Future Cursor Migration Strategy

- introduce cursor mode via explicit query parameter or new endpoint behavior contract
- do not silently replace page-based metadata

---

## 6. Versioning Strategy

- no URL versioning in initial release
- canonical path remains `/api/...`
- contract versioning is managed through documentation discipline and controlled deprecation

### Internal Contract Versioning

- breaking changes require ADR/doc update and coordinated release note
- non-breaking additive changes may ship without URL version bump

### Deprecation Communication Rules

- update docs first
- note deprecation in PR/change log
- notify dependent frontend/backend teams before rollout

---

## 7. Definition of Done

API evolution policy นี้ถือว่าพร้อมใช้เมื่อ:

- ทีมสามารถตัดสินได้ทันทีว่า change ใดเป็น breaking
- contract stability ถูกยึดเป็น policy ก่อนเริ่มขยาย API surface
