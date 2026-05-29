# healthcare-kpi-hub API Contract

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering
**Primary References**:
- `docs/ARCHITECTURE_V2.md`
- `docs/DOMAIN_MODEL.md`
- `docs/AUTH_INTEGRATION.md`
- `docs/RBAC_MATRIX.md`
- `docs/SQLITE_SCHEMA.md`

---

## 1. Purpose

เอกสารนี้เป็น API contract ระดับ implementation-ready สำหรับ `healthcare-kpi-hub` เพื่อให้ frontend, backend, QA, และ security ใช้ข้อตกลงเดียวกัน โดยไม่ต้องตีความจาก prose description เอง

---

## 2. Global API Rules

### Base Path

- ทุก endpoint อยู่ภายใต้ `/api`

### Content Type

- request body ใช้ `application/json` ยกเว้น file upload
- response body ใช้ `application/json`
- import upload ใช้ `multipart/form-data`

### Authentication Model

- ใช้ session cookie เป็นหลัก
- ทุก endpoint ที่ไม่ใช่ `POST /api/auth/login` ต้องถือว่า authenticated by default เว้นแต่ระบุเป็นสาธารณะชัดเจน

### Authorization Model

- permission enforcement อยู่ที่ backend
- endpoint แต่ละตัวต้องระบุ required permission แบบ explicit

### Resource Identifiers

- ใช้ opaque string IDs
- path params ต้องเป็น non-empty string

### Timestamp Format

- ทุก timestamp ใน response ใช้ ISO-8601 UTC string

### Enum Validation

- field ที่เป็น enum-like value ต้อง reject หากไม่อยู่ใน allowed values

---

## 3. Standard Response Shapes

### 3.1 Success Envelope

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

### 3.2 Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "AUTH_FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": [
      {
        "field": "reporting_period_id",
        "issue": "must_be_open"
      }
    ]
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

### 3.3 Error Code Rules

- `AUTH_*` สำหรับ authentication/authorization
- `VALIDATION_*` สำหรับ request validation
- `NOT_FOUND_*` สำหรับ missing resources
- `CONFLICT_*` สำหรับ concurrent or state conflicts
- `IMPORT_*` สำหรับ ingestion errors
- `INTERNAL_*` สำหรับ unexpected server errors

---

## 4. Pagination, Filtering, and Sorting

### Pagination Pattern

list endpoints ใช้ query params:

- `page`: integer, default `1`, minimum `1`
- `page_size`: integer, default `20`, minimum `1`, maximum `100`

response `meta.pagination`:

```json
{
  "page": 1,
  "page_size": 20,
  "total_items": 135,
  "total_pages": 7
}
```

### Filtering Conventions

- filtering ใช้ query params แบบ flat
- date filters ใช้ suffix `_from` และ `_to`
- exact match ใช้ชื่อ field ตรง
- list filters ใช้ comma-separated string

ตัวอย่าง:

- `status=open`
- `assigned_to=jane.doe`
- `due_from=2026-05-01T00:00:00Z`
- `due_to=2026-05-31T23:59:59Z`
- `section_ids=sec_1,sec_2`

### Sorting Conventions

- ใช้ `sort` parameter
- ascending: `sort=due_at`
- descending: `sort=-updated_at`
- หาก endpoint จำกัด fields ที่ sort ได้ ต้อง reject unsupported sort values

---

## 5. Auth and Conflict Rules

### Auth Requirement Vocabulary

- `public`: ไม่ต้อง login
- `authenticated`: ต้องมี session ที่ valid

### Conflict Behavior

mutation endpoints ที่แก้ไข state สำคัญต้องรองรับ optimistic conflict detection โดยใช้หนึ่งในสองแนวทาง:

- `updated_at` ใน payload สำหรับ stateful patch
- `If-Unmodified-Since` header ในอนาคต หากทีมต้องการ

สำหรับ initial release ให้ใช้ `updated_at` ใน body

เมื่อ conflict:

- ตอบ `409 Conflict`
- ใช้ error code `CONFLICT_STALE_WRITE`

---

## 6. Endpoint Summary

| Endpoint | Method | Auth | Permission |
|---|---|---|---|
| `/api/auth/login` | `POST` | public | none |
| `/api/auth/logout` | `POST` | authenticated | none |
| `/api/me` | `GET` | authenticated | none |
| `/api/worklist` | `GET` | authenticated | `worklist.read` |
| `/api/navigation` | `GET` | authenticated | `worklist.read` |
| `/api/kpi-pages/:pageId` | `GET` | authenticated | `kpi.read` |
| `/api/kpi-pages/:pageId/entries` | `GET` | authenticated | `kpi.read` |
| `/api/kpi-entries/:entryId` | `GET` | authenticated | `kpi.read` |
| `/api/kpi-entries/:entryId` | `PATCH` | authenticated | `kpi.update` |
| `/api/imports` | `GET` | authenticated | `kpi.import` |
| `/api/imports` | `POST` | authenticated | `kpi.import` |
| `/api/imports/:jobId` | `GET` | authenticated | `kpi.import` |
| `/api/imports/:jobId/preview` | `GET` | authenticated | `kpi.import` |
| `/api/imports/:jobId/commit` | `POST` | authenticated | `kpi.import` |
| `/api/admin/navigation/workgroups` | `GET` | authenticated | `admin.navigation` |
| `/api/admin/navigation/workgroups` | `POST` | authenticated | `admin.navigation` |
| `/api/admin/navigation/sections` | `POST` | authenticated | `admin.navigation` |
| `/api/admin/navigation/pages` | `POST` | authenticated | `admin.navigation` |
| `/api/admin/kpi-definitions` | `GET` | authenticated | `admin.kpi_definition` |
| `/api/admin/kpi-definitions` | `POST` | authenticated | `admin.kpi_definition` |
| `/api/admin/kpi-definitions/:id` | `PUT` | authenticated | `admin.kpi_definition` |
| `/api/admin/users` | `GET` | authenticated | `admin.users` |
| `/api/admin/users/:id/role` | `PATCH` | authenticated | `admin.users` |
| `/api/audit/events` | `GET` | authenticated | `audit.read` |

---

## 7. Auth Endpoints

### 7.1 `POST /api/auth/login`

- Auth: `public`
- Permission: none
- Status codes: `200`, `400`, `401`, `429`, `503`, `500`

Request body:

```json
{
  "username": "jane.doe",
  "password": "secret"
}
```

Validation:

- `username`: required, string, trimmed, min length `3`, max length `100`
- `password`: required, string, min length `1`, max length `256`

Success response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_01JX...",
      "username": "jane.doe",
      "full_name": "Jane Doe",
      "role_code": "editor",
      "permissions": [
        "worklist.read",
        "kpi.read",
        "kpi.update"
      ],
      "is_active": true
    }
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

Error examples:

- `401 AUTH_INVALID_CREDENTIALS`
- `401 AUTH_ACCOUNT_INACTIVE`
- `429 AUTH_RATE_LIMITED`
- `503 AUTH_UPSTREAM_UNAVAILABLE`

Behavior:

- server sets session cookie
- frontend must treat response body as current identity bootstrap only

### 7.2 `POST /api/auth/logout`

- Auth: `authenticated`
- Permission: none
- Status codes: `200`, `401`

Request body:

```json
{}
```

Success response:

```json
{
  "success": true,
  "data": {
    "logged_out": true
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

Behavior:

- revoke current session
- clear session cookie

---

## 8. Current User Endpoint

### 8.1 `GET /api/me`

- Auth: `authenticated`
- Permission: none
- Status codes: `200`, `401`

Success response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_01JX...",
      "username": "jane.doe",
      "full_name": "Jane Doe",
      "role_code": "editor",
      "permissions": [
        "worklist.read",
        "kpi.read",
        "kpi.update"
      ],
      "is_active": true,
      "last_login_at": "2026-05-28T08:55:00Z"
    }
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

---

## 9. Worklist Endpoint

### 9.1 `GET /api/worklist`

- Auth: `authenticated`
- Permission: `worklist.read`
- Status codes: `200`, `400`, `401`, `403`

Query params:

- `period_key`: optional, string, default current open period
- `status`: optional, comma-separated list of `pending,overdue,updated,review`
- `assigned_to`: optional, string, defaults to current user when `mine=true`
- `mine`: optional, boolean, default `true`
- `page`, `page_size`, `sort`

Allowed sort fields:

- `due_at`
- `updated_at`
- `status`

Success response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "entry_id": "ent_01JX...",
        "kpi_definition_id": "kpd_01JX...",
        "kpi_code": "KPI-001",
        "kpi_name": "Vaccination Coverage",
        "page_id": "pag_01JX...",
        "page_name": "Prevention Metrics",
        "workgroup_name": "Public Health",
        "section_name": "Disease Control",
        "reporting_period_key": "2026-05",
        "status": "pending",
        "assigned_to": "jane.doe",
        "due_at": "2026-05-31T17:00:00Z",
        "updated_at": "2026-05-20T08:00:00Z",
        "editable": true
      }
    ]
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z",
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 1,
      "total_pages": 1
    }
  }
}
```

Validation:

- `period_key`: max length `20`
- `page`: integer >= `1`
- `page_size`: integer 1..100

---

## 10. Navigation Endpoint

### 10.1 `GET /api/navigation`

- Auth: `authenticated`
- Permission: `worklist.read`
- Status codes: `200`, `401`, `403`

Response:

```json
{
  "success": true,
  "data": {
    "workgroups": [
      {
        "id": "wrk_01",
        "code": "PH",
        "name": "Public Health",
        "sections": [
          {
            "id": "sec_01",
            "code": "DC",
            "name": "Disease Control",
            "pages": [
              {
                "id": "pag_01",
                "code": "PREVENTION",
                "name": "Prevention Metrics",
                "is_active": true
              }
            ]
          }
        ]
      }
    ]
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

---

## 11. KPI Page Endpoints

### 11.1 `GET /api/kpi-pages/:pageId`

- Auth: `authenticated`
- Permission: `kpi.read`
- Status codes: `200`, `401`, `403`, `404`

Path params:

- `pageId`: required, non-empty string

Response:

```json
{
  "success": true,
  "data": {
    "page": {
      "id": "pag_01",
      "code": "PREVENTION",
      "name": "Prevention Metrics",
      "description": "Monthly prevention KPIs",
      "section": {
        "id": "sec_01",
        "code": "DC",
        "name": "Disease Control"
      },
      "workgroup": {
        "id": "wrk_01",
        "code": "PH",
        "name": "Public Health"
      }
    },
    "hierarchy": {
      "current_node": {
        "page_id": "pag_01",
        "code": "PREVENTION",
        "name": "Prevention Metrics",
        "hierarchy_level": "unit",
        "owner_label": "Disease Control Unit",
        "owner_user": null
      },
      "parent_node": {
        "page_id": "pag_parent",
        "code": "PROMOTION",
        "name": "Promotion Metrics",
        "hierarchy_level": "department",
        "owner_label": "Health Promotion Division",
        "owner_user": null
      },
      "child_nodes": [
        {
          "page_id": "pag_child",
          "code": "ANALYST",
          "name": "KPI Analyst Page",
          "hierarchy_level": "individual",
          "owner_label": "Senior KPI Analyst",
          "owner_user": {
            "id": "usr_02",
            "username": "editor.user",
            "full_name": "Editor User"
          }
        }
      ]
    },
    "current_period": {
      "id": "rpt_01",
      "period_key": "2026-05",
      "status": "open",
      "starts_at": "2026-05-01T00:00:00Z",
      "ends_at": "2026-05-31T23:59:59Z"
    },
    "assigned_kpis": [
      {
        "definition": {
          "id": "kpd_01",
          "code": "KPI-001",
          "name": "Vaccination Coverage",
          "unit": "%",
          "value_type": "percentage",
          "preset_code": "percentage",
          "owner_label": "District Epidemiology Team"
        },
        "assignment": {
          "entry_id": "ent_01",
          "status": "pending",
          "assigned_to": "jane.doe",
          "due_at": "2026-05-31T17:00:00Z",
          "updated_at": "2026-05-20T08:00:00Z",
          "updated_by": "john.manager",
          "editable": true
        },
        "value": {
          "target_value": "95",
          "actual_value": "91",
          "progress_value": 0.9579,
          "note": "Awaiting final district confirmation",
          "extra_json": null
        }
      }
    ]
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

Behavior:

- returns a hierarchy-aware read model for the requested KPI page
- navigation grouping and ownership hierarchy are not assumed to be the same concern
- `current_node`, `parent_node`, and `child_nodes` describe ownership hierarchy context
- hierarchy is intentionally tree-structured in the current release; `parent_node` is singular and may be `null`
- `assigned_kpis` contains KPI assignments attached to the current node for the current open reporting period
- when no open reporting period exists, `current_period` may be `null` and `assigned_kpis` still reflects configured KPI definitions with no current assignment row
- when the page exists but has no KPI assignments, `assigned_kpis` is an empty array
- `definition` inside `assigned_kpis` represents template semantics; `assignment` and `value` represent the current period operational projection for this node
- `owner_label` plus optional `owner_user` is the only ownership model exposed in the current release

Hierarchy level allowed values:

- `organization`
- `department`
- `unit`
- `individual`

Notes:

- these hierarchy levels are intentionally simplified for the current release
- additional levels such as `division`, `section`, `program`, or `committee` require controlled migration and contract revision before use

### 11.2 `GET /api/kpi-pages/:pageId/entries`

- Auth: `authenticated`
- Permission: `kpi.read`
- Status codes: `200`, `400`, `401`, `403`, `404`

Query params:

- `period_key`: required, string
- `status`: optional, comma-separated list of `draft,pending,submitted,locked`

Response:

```json
{
  "success": true,
  "data": {
    "period": {
      "id": "rpt_01",
      "period_key": "2026-05",
      "status": "open"
    },
    "entries": [
      {
        "entry_id": "ent_01",
        "definition": {
          "id": "kpd_01",
          "code": "KPI-001",
          "name": "Vaccination Coverage",
          "unit": "%",
          "value_type": "percentage",
          "preset_code": "percentage"
        },
        "workflow": {
          "status": "pending",
          "assigned_to": "jane.doe",
          "due_at": "2026-05-31T17:00:00Z",
          "editable": true,
          "updated_at": "2026-05-20T08:00:00Z",
          "updated_by": "john.manager"
        },
        "value": {
          "target_value": "95",
          "actual_value": "91",
          "progress_value": 0.9579,
          "note": "Awaiting final district confirmation"
        }
      }
    ]
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

Validation:

- `period_key`: required, max length `20`

---

## 12. KPI Entry Endpoints

### 12.1 `GET /api/kpi-entries/:entryId`

- Auth: `authenticated`
- Permission: `kpi.read`
- Status codes: `200`, `401`, `403`, `404`

Path params:

- `entryId`: required, non-empty string

Response:

```json
{
  "success": true,
  "data": {
    "entry": {
      "id": "ent_01",
      "status": "pending",
      "assigned_to": "jane.doe",
      "due_at": "2026-05-31T17:00:00Z",
      "updated_at": "2026-05-20T08:00:00Z",
      "updated_by": "john.manager",
      "editable": true
    },
    "definition": {
      "id": "kpd_01",
      "code": "KPI-001",
      "name": "Vaccination Coverage",
      "unit": "%",
      "value_type": "percentage",
      "preset_code": "percentage",
      "owner_label": "District Epidemiology Team"
    },
    "reporting_period": {
      "id": "rpt_01",
      "period_key": "2026-05",
      "period_type": "monthly",
      "status": "open",
      "starts_at": "2026-05-01T00:00:00Z",
      "ends_at": "2026-05-31T23:59:59Z"
    },
    "page": {
      "id": "pag_01",
      "code": "PREVENTION",
      "name": "Prevention Metrics",
      "section": {
        "id": "sec_01",
        "code": "DC",
        "name": "Disease Control"
      },
      "workgroup": {
        "id": "wrk_01",
        "code": "PH",
        "name": "Public Health"
      }
    },
    "hierarchy": {
      "current_node": {
        "page_id": "pag_01",
        "code": "PREVENTION",
        "name": "Prevention Metrics",
        "hierarchy_level": "unit",
        "owner_label": "Disease Control Unit",
        "owner_user": null
      },
      "parent_node": {
        "page_id": "pag_parent",
        "code": "PROMOTION",
        "name": "Promotion Metrics",
        "hierarchy_level": "department",
        "owner_label": "Health Promotion Division",
        "owner_user": null
      },
      "child_nodes": []
    },
    "value": {
      "target_value": "95",
      "actual_value": "91",
      "progress_value": 0.9579,
      "note": "Awaiting final district confirmation",
      "extra_json": null
    },
    "history": [
      {
        "audit_event_id": "aud_01",
        "action": "kpi_entry.updated",
        "actor_username": "john.manager",
        "occurred_at": "2026-05-20T08:00:00Z",
        "summary": "Updated KPI values after district review."
      }
    ]
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

Behavior:

- returns the period-scoped operational read model for one KPI entry
- `definition` represents template-level KPI semantics and must not be interpreted as a period-specific master record
- `entry` is the current operational assignment/workflow record for the selected reporting period
- `value` is the operational value payload and may be entirely empty when no value row exists yet
- `reporting_period`, `page`, and `hierarchy` provide breadcrumb and ownership context for read-only inspection
- `history` returns recent audit events for the KPI entry and may be empty
- if the entry exists but the related definition, page, hierarchy context, or reporting period is inactive or missing, the endpoint returns `404`

### 12.2 `PATCH /api/kpi-entries/:entryId`

- Auth: `authenticated`
- Permission: `kpi.update`
- Status codes: `200`, `400`, `401`, `403`, `404`, `409`

Request body:

```json
{
  "updated_at": "2026-05-20T08:00:00Z",
  "status": "submitted",
  "assigned_to": "jane.doe",
  "due_at": "2026-05-31T17:00:00Z",
  "value": {
    "target_value": "95",
    "actual_value": "92",
    "progress_value": 0.9684,
    "note": "Updated after district verification",
    "extra_json": null
  }
}
```

Validation:

- `updated_at`: required, ISO timestamp
- `status`: optional, one of `draft,pending,submitted`
- `assigned_to`: optional, string, max length `100`
- `due_at`: optional, ISO timestamp or `null`
- `target_value`: optional, string, max length `100`
- `actual_value`: optional, string, max length `100`
- `progress_value`: optional, number, 0..1
- `note`: optional, string, max length `2000`
- `extra_json`: optional, object or `null`

Business validation:

- entry must belong to an open reporting period
- entry must not be locked
- current user must satisfy role/permission policy
- payload must satisfy preset/value type rules

Conflict response example:

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT_STALE_WRITE",
    "message": "The KPI entry was updated by another user.",
    "details": [
      {
        "field": "updated_at",
        "issue": "stale_value"
      }
    ]
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

---

## 13. Import Endpoints

### 13.1 `GET /api/imports`

- Auth: `authenticated`
- Permission: `kpi.import`
- Status codes: `200`, `401`, `403`

Query params:

- `status`: optional, comma-separated `uploaded,validated,ready_to_commit,committed,failed`
- `created_by`: optional
- `page`, `page_size`, `sort`

### 13.2 `POST /api/imports`

- Auth: `authenticated`
- Permission: `kpi.import`
- Status codes: `201`, `400`, `401`, `403`, `413`, `415`, `422`

Request:

- multipart form with field `file`

Response:

```json
{
  "success": true,
  "data": {
    "job": {
      "id": "imp_01",
      "source_filename": "kpi-may-2026.xlsx",
      "status": "uploaded",
      "created_by": "jane.doe",
      "created_at": "2026-05-28T09:00:00Z"
    }
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

### 13.3 `GET /api/imports/:jobId`

- Auth: `authenticated`
- Permission: `kpi.import`
- Status codes: `200`, `401`, `403`, `404`

### 13.4 `GET /api/imports/:jobId/preview`

- Auth: `authenticated`
- Permission: `kpi.import`
- Status codes: `200`, `401`, `403`, `404`, `422`

Response:

```json
{
  "success": true,
  "data": {
    "job": {
      "id": "imp_01",
      "status": "ready_to_commit"
    },
    "summary": {
      "total_rows": 25,
      "valid_rows": 23,
      "invalid_rows": 2,
      "warnings": 1
    },
    "issues": [
      {
        "row_number": 12,
        "column": "actual_value",
        "issue": "invalid_percentage"
      }
    ],
    "preview_rows": []
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

### 13.5 `POST /api/imports/:jobId/commit`

- Auth: `authenticated`
- Permission: `kpi.import`
- Status codes: `200`, `401`, `403`, `404`, `409`, `422`

Request body:

```json
{
  "confirm": true
}
```

Validation:

- `confirm`: required, must be `true`
- job must be `ready_to_commit`

Response:

```json
{
  "success": true,
  "data": {
    "job": {
      "id": "imp_01",
      "status": "committed"
    },
    "commit_summary": {
      "created_entries": 2,
      "updated_entries": 21,
      "skipped_rows": 2
    }
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

---

## 14. Admin Endpoints

### 14.1 `GET /api/admin/navigation/workgroups`

- Auth: `authenticated`
- Permission: `admin.navigation`
- Status codes: `200`, `401`, `403`

### 14.2 `POST /api/admin/navigation/workgroups`

- Auth: `authenticated`
- Permission: `admin.navigation`
- Status codes: `201`, `400`, `401`, `403`, `409`

Request body:

```json
{
  "code": "PH",
  "name": "Public Health",
  "sort_order": 10,
  "is_active": true
}
```

Validation:

- `code`: required, uppercase-safe string, max length `50`
- `name`: required, max length `255`
- `sort_order`: required, integer >= `0`
- `is_active`: required, boolean

### 14.3 `POST /api/admin/navigation/sections`

- Auth: `authenticated`
- Permission: `admin.navigation`
- Status codes: `201`, `400`, `401`, `403`, `409`

Request body:

```json
{
  "workgroup_id": "wrk_01",
  "code": "DC",
  "name": "Disease Control",
  "sort_order": 10,
  "is_active": true
}
```

### 14.4 `POST /api/admin/navigation/pages`

- Auth: `authenticated`
- Permission: `admin.navigation`
- Status codes: `201`, `400`, `401`, `403`, `409`

Request body:

```json
{
  "section_id": "sec_01",
  "code": "PREVENTION",
  "name": "Prevention Metrics",
  "description": "Monthly prevention KPIs",
  "sort_order": 10,
  "is_active": true
}
```

### 14.5 `GET /api/admin/kpi-definitions`

- Auth: `authenticated`
- Permission: `admin.kpi_definition`
- Status codes: `200`, `401`, `403`

### 14.6 `POST /api/admin/kpi-definitions`

- Auth: `authenticated`
- Permission: `admin.kpi_definition`
- Status codes: `201`, `400`, `401`, `403`, `409`

Request body:

```json
{
  "kpi_page_id": "pag_01",
  "code": "KPI-001",
  "name": "Vaccination Coverage",
  "unit": "%",
  "value_type": "percentage",
  "preset_code": "percentage",
  "owner_label": "District Epidemiology Team",
  "sort_order": 10,
  "is_active": true
}
```

Validation:

- `value_type`: one of values defined in `docs/SQLITE_SCHEMA.md`
- `preset_code`: one of values defined in `docs/SQLITE_SCHEMA.md`

### 14.7 `PUT /api/admin/kpi-definitions/:id`

- Auth: `authenticated`
- Permission: `admin.kpi_definition`
- Status codes: `200`, `400`, `401`, `403`, `404`, `409`

Conflict behavior:

- use body `updated_at` when definition becomes mutable in future iterations
- for initial phase, reject destructive changes that would invalidate historical entries

### 14.8 `GET /api/admin/users`

- Auth: `authenticated`
- Permission: `admin.users`
- Status codes: `200`, `401`, `403`

### 14.9 `PATCH /api/admin/users/:id/role`

- Auth: `authenticated`
- Permission: `admin.users`
- Status codes: `200`, `400`, `401`, `403`, `404`

Request body:

```json
{
  "role_code": "manager",
  "force_logout": true
}
```

Validation:

- `role_code`: required, allowed seeded role
- `force_logout`: required, boolean

---

## 15. Audit Endpoint

### 15.1 `GET /api/audit/events`

- Auth: `authenticated`
- Permission: `audit.read`
- Status codes: `200`, `400`, `401`, `403`

Query params:

- `entity_type`: optional
- `entity_id`: optional
- `actor_username`: optional
- `action`: optional
- `occurred_from`: optional ISO timestamp
- `occurred_to`: optional ISO timestamp
- `page`, `page_size`, `sort`

Allowed sort:

- `occurred_at`
- `action`

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "aud_01",
        "entity_type": "kpi_entry",
        "entity_id": "ent_01",
        "action": "kpi_entry.updated",
        "actor_username": "jane.doe",
        "occurred_at": "2026-05-28T09:00:00Z",
        "payload_json": {
          "changed_fields": [
            "actual_value",
            "note"
          ]
        }
      }
    ]
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z",
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 1,
      "total_pages": 1
    }
  }
}
```

---

## 16. Standard Validation Failure Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "page_size",
        "issue": "must_be_less_than_or_equal_to_100"
      },
      {
        "field": "status",
        "issue": "unsupported_value"
      }
    ]
  },
  "meta": {
    "request_id": "req_01JX...",
    "timestamp": "2026-05-28T09:00:00Z"
  }
}
```

---

## 17. Definition of Done

API contract นี้ถือว่า implementation-ready เมื่อ:

- ทุก endpoint สำคัญมี request/response/validation/auth/permission/status code ครบ
- success และ error envelope ถูกใช้แบบ consistent ทั้งระบบ
- mutation endpoints ที่สำคัญมี conflict policy ชัดเจน
- frontend และ backend สามารถเริ่มแยกงานจากเอกสารนี้ได้โดยไม่ต้องเดา payload เอง
