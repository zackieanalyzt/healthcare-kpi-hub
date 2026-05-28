# healthcare-kpi-hub RBAC Matrix

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering
**Primary References**:
- `docs/AUTH_INTEGRATION.md`
- `docs/API_CONTRACT.md`
- `docs/FRONTEND_SCREEN_MAP.md`

---

## 1. Purpose

เอกสารนี้กำหนด role-based access control matrix ของระบบ เพื่อป้องกัน authorization drift ระหว่าง frontend, backend, และเอกสารประกอบอื่น

---

## 2. Roles

- `admin`
- `manager`
- `editor`
- `viewer`

---

## 3. Permission Catalog

- `worklist.read`
- `kpi.read`
- `kpi.update`
- `kpi.import`
- `dashboard.read`
- `admin.navigation`
- `admin.kpi_definition`
- `admin.users`
- `audit.read`

---

## 4. Role Matrix

| Role | Permission | Allowed Resources | Allowed Actions | Restricted Areas |
|---|---|---|---|---|
| `admin` | all listed permissions | all app resources | read, create, update, manage admin config, view audit, import | no restriction except future break-glass controls |
| `manager` | `worklist.read`, `kpi.read`, `kpi.update`, `dashboard.read`, `audit.read` | worklist, KPI pages, KPI entries, dashboard, audit events relevant to authorized scope | review, update, re-open, submit, inspect audit | cannot manage navigation, definitions, users, or import unless separately granted in future |
| `editor` | `worklist.read`, `kpi.read`, `kpi.update` | worklist, KPI pages, assigned KPI entries | update operational KPI data, submit values | cannot access admin, audit viewer, or import |
| `viewer` | `worklist.read`, `kpi.read`, `dashboard.read` | worklist summary, KPI pages read-only, dashboard | read-only viewing | cannot update KPI, import, audit, or admin |

---

## 5. Endpoint to Permission Mapping

| Endpoint | Method | Required Permission |
|---|---|---|
| `/api/auth/login` | `POST` | none |
| `/api/auth/logout` | `POST` | authenticated session only |
| `/api/me` | `GET` | authenticated session only |
| `/api/worklist` | `GET` | `worklist.read` |
| `/api/navigation` | `GET` | `worklist.read` |
| `/api/kpi-pages/:pageId` | `GET` | `kpi.read` |
| `/api/kpi-pages/:pageId/entries` | `GET` | `kpi.read` |
| `/api/kpi-entries/:entryId` | `GET` | `kpi.read` |
| `/api/kpi-entries/:entryId` | `PATCH` | `kpi.update` |
| `/api/imports` | `GET` | `kpi.import` |
| `/api/imports` | `POST` | `kpi.import` |
| `/api/imports/:jobId` | `GET` | `kpi.import` |
| `/api/imports/:jobId/preview` | `GET` | `kpi.import` |
| `/api/imports/:jobId/commit` | `POST` | `kpi.import` |
| `/api/admin/navigation/workgroups` | `GET` | `admin.navigation` |
| `/api/admin/navigation/workgroups` | `POST` | `admin.navigation` |
| `/api/admin/navigation/sections` | `POST` | `admin.navigation` |
| `/api/admin/navigation/pages` | `POST` | `admin.navigation` |
| `/api/admin/kpi-definitions` | `GET` | `admin.kpi_definition` |
| `/api/admin/kpi-definitions` | `POST` | `admin.kpi_definition` |
| `/api/admin/kpi-definitions/:id` | `PUT` | `admin.kpi_definition` |
| `/api/admin/users` | `GET` | `admin.users` |
| `/api/admin/users/:id/role` | `PATCH` | `admin.users` |
| `/api/audit/events` | `GET` | `audit.read` |

---

## 6. Screen and Module to Permission Mapping

| Screen / Module | Required Permission |
|---|---|
| Login | none |
| Worklist Home | `worklist.read` |
| Navigation Shell | `worklist.read` |
| KPI Page | `kpi.read` |
| KPI Entry Update Panel | `kpi.update` |
| Dashboard | `dashboard.read` |
| Import Wizard | `kpi.import` |
| Admin Navigation Management | `admin.navigation` |
| Admin KPI Definition Management | `admin.kpi_definition` |
| Admin User Role Management | `admin.users` |
| Audit Viewer | `audit.read` |

---

## 7. Enforcement Rules

- frontend อาจซ่อน menu, button, หรือ route entry points ตาม permission
- backend ต้อง enforce permission ทุก endpoint
- service layer ต้อง enforce business scope เพิ่มเติม เช่น editable state ของ KPIEntry
- deny by default หาก endpoint ใหม่ยังไม่ถูก map ใน matrix นี้

---

## 8. Default Role Assignment

- first-time successful login ได้ default role เป็น `viewer`
- การยกระดับเป็น `editor`, `manager`, หรือ `admin` เป็นงานของ admin ในระบบใหม่
- default role นี้ตั้งใจให้ปลอดภัยโดยเริ่มจาก least privilege

---

## 9. Definition of Done

RBAC matrix นี้ถือว่า implementation-ready เมื่อ:

- endpoint และ screen สำคัญทุกจุดถูก map กับ permission ชัดเจน
- ไม่มี role ใดที่ต้องอาศัยการตีความจาก chat history
- backend และ frontend สามารถ implement authorization จากเอกสารนี้ได้ตรงกัน
