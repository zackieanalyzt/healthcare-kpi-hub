# healthcare-kpi-hub Frontend Screen Map

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Product + Engineering
**Primary References**:
- `docs/ARCHITECTURE_V2.md`
- `docs/API_CONTRACT.md`
- `docs/RBAC_MATRIX.md`

---

## 1. Purpose

เอกสารนี้กำหนด UX baseline, route structure, และ screen hierarchy สำหรับ frontend เพื่อไม่ให้ทีม frontend ต้องออกแบบ flow เองในจุดสำคัญ

---

## 2. Route Structure

| Route | Screen | Auth | Permission |
|---|---|---|---|
| `/login` | Login | public | none |
| `/` | App redirect | authenticated | based on user permissions |
| `/worklist` | Worklist Home | authenticated | `worklist.read` |
| `/dashboard` | Dashboard | authenticated | `dashboard.read` |
| `/pages/:pageId` | KPI Page | authenticated | `kpi.read` |
| `/entries/:entryId` | KPI Entry Detail / Side Panel host | authenticated | `kpi.read` |
| `/imports` | Import Jobs List | authenticated | `kpi.import` |
| `/imports/new` | Import Wizard | authenticated | `kpi.import` |
| `/admin/navigation` | Navigation Management | authenticated | `admin.navigation` |
| `/admin/kpi-definitions` | KPI Definition Management | authenticated | `admin.kpi_definition` |
| `/admin/users` | User and Role Management | authenticated | `admin.users` |
| `/audit` | Audit Viewer | authenticated | `audit.read` |
| `/forbidden` | Access Denied | authenticated | none |

---

## 3. Screen Hierarchy

- Public
  - Login

- Authenticated App Shell
  - Worklist Home
  - Dashboard
  - KPI Page
  - KPI Entry Detail / Update
  - Import Area
  - Admin Area
  - Audit Viewer

Admin area ต้องถูกแยกจาก operational flow ทั้งใน navigation และ mental model

---

## 4. Login Flow

1. user เปิด `/login`
2. กรอก username/password
3. submit ไป `POST /api/auth/login`
4. หากสำเร็จ client โหลด `/api/me`
5. redirect ตาม permission:
   - มี `worklist.read` ไป `/worklist`
   - ถ้าไม่มี `worklist.read` แต่มี `dashboard.read` ไป `/dashboard`
   - มิฉะนั้นไป `/forbidden`

states:

- loading: disable submit และแสดง progress
- invalid credentials: inline form error
- upstream unavailable: show retry-friendly error

---

## 5. Worklist Home

purpose:

- เป็น landing screen หลักหลัง login

sections:

- current period summary
- assigned items
- overdue items
- recently updated items
- quick links ไป KPI pages ที่ใช้บ่อย

interactions:

- filter by period
- filter mine/all within authorization scope
- sort by due date or recently updated
- click item เพื่อเปิด KPI page หรือ entry detail

empty states:

- no items for current period
- no assigned items

error states:

- failed to load worklist

loading states:

- skeleton for list cards/table

---

## 6. KPI Page

purpose:

- แสดงรายการ KPI entries ของ page หนึ่งใน reporting period ที่เลือก

layout:

- page header
- breadcrumbs
- period selector
- filter bar
- KPI table/cards
- optional side panel for entry update

interactions:

- switch period
- open entry detail
- inline or side-panel update when allowed

states:

- loading page metadata
- loading entries
- page not found
- page inactive
- no entries for selected period

---

## 7. KPI Entry Update Flow

1. user เปิด KPI entry จาก worklist หรือ KPI page
2. client โหลด `GET /api/kpi-entries/:entryId`
3. ถ้า `editable=true` และ user มี `kpi.update` แสดง editable controls
4. user แก้ค่าและ submit
5. client ส่ง `PATCH /api/kpi-entries/:entryId`
6. ถ้าสำเร็จ update local screen state
7. ถ้า `409 CONFLICT_STALE_WRITE` ให้บังคับ refresh entry data และแจ้งผู้ใช้

states:

- read-only when no permission
- locked state when period closed or entry locked
- validation error state
- conflict state

---

## 8. Dashboard

purpose:

- แสดง summary สำหรับ manager/viewer roles

sections:

- completion rate
- overdue count
- trend summaries
- summary by workgroup/section

constraints:

- dashboard เป็น secondary screen ไม่ใช่ landing page หลักของ operational users

states:

- loading charts/summary cards
- no data for selected period
- insufficient permission

---

## 9. Admin Flow

admin flow แยกจาก operational flow ชัดเจน:

- Navigation Management
- KPI Definition Management
- User and Role Management

navigation behavior:

- menu admin แสดงเฉพาะเมื่อมี permission ตรง
- admin route เข้าตรงได้ แต่ backend ต้อง enforce ซ้ำ

### 9.1 Navigation Management

functions:

- create/update workgroup
- create/update section
- create/update KPI page
- activate/deactivate nodes

states:

- empty state for no configured navigation
- validation errors for duplicate code

### 9.2 KPI Definition Management

functions:

- list definitions
- create definition
- edit allowed metadata
- activate/deactivate definition

constraints:

- destructive change ต้องไม่ทำให้ historical KPI semantics แตก

### 9.3 User and Role Management

functions:

- list users
- change role
- activate/deactivate local user
- optionally force logout

---

## 10. Import Wizard Flow

1. open `/imports/new`
2. select file
3. upload file
4. parse and validate
5. preview issues and row summary
6. confirm commit
7. show commit result

screens/steps:

- upload step
- validation step
- preview step
- commit confirmation step
- result step

states:

- unsupported file type
- oversized file
- malformed spreadsheet
- validation errors
- partial row rejection
- commit success/failure

---

## 11. Audit Viewer

purpose:

- allow authorized users to inspect business-significant events

features:

- filter by entity_type
- filter by actor
- filter by action
- filter by date range
- pagination

states:

- no results
- access denied
- load error

---

## 12. Navigation Behavior

- left navigation แสดง workgroup > section > page
- active route ต้องสะท้อน current location
- inactive nodes ไม่แสดงใน operational navigation ปกติ
- admin routes อยู่คนละ navigation group

---

## 13. Empty, Loading, and Error State Rules

- ทุก data-fetching screen ต้องมี loading state
- ทุก list screen ต้องมี explicit empty state
- forbidden state กับ unauthenticated state ต้องแยกกัน
- API validation errors ต้องแสดงใกล้ field หรือ action ที่เกี่ยวข้อง
- conflict error ของ KPI update ต้องมี user-facing guidance ให้ refresh

---

## 14. Definition of Done

screen map นี้ถือว่า implementation-ready เมื่อ:

- route structure และ screen hierarchy ถูกล็อก
- flow สำคัญทั้งหมดมี baseline ชัดเจน
- frontend dev สามารถเริ่มทำ app shell และ feature modules ได้โดยไม่ต้องเดา UX หลักเอง
