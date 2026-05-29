# Hospital Role and Authorization Scope Requirements

**Status**: Captured, gated future capability
**Starting checkpoint**: `0705d7b docs: finalize controlled pilot rehearsal logistics`
**Date**: `2026-05-29`

## 1. Purpose

This document captures a future design requirement for hospital-oriented role modeling in `healthcare-kpi-hub`.

It is a design and requirement capture only.

It does not implement:

- new roles in code
- new permissions in code
- RBAC logic changes
- schema or migration changes
- seed changes
- frontend or API behavior changes

## 2. Core Principle

`healthcare-kpi-hub` must not treat an organizational position as a one-to-one system role.

Authorization must be modeled as:

`system role + hierarchy scope + explicit permission`

Examples:

- `role = executive`
  `scope = hospital-wide`
  `permission = dashboard.read`
- `role = department_manager`
  `scope = กลุ่มงานสุขภาพดิจิทัล`
  `permission = kpi.review`
- `role = department_manager`
  `scope = กลุ่มงานสุขภาพดิจิทัล`
  `permission = dashboard.read`

## 3. Distinction To Preserve

The future model must separate these concepts clearly:

- organizational position
- system role
- authorization scope

Example:

- `ผู้อำนวยการ` = organizational position
- `executive` = system role
- `hospital-wide` = authorization scope

Another example:

- `หัวหน้ากลุ่มงานสุขภาพดิจิทัล` = organizational position
- `department_manager` = system role
- `กลุ่มงานสุขภาพดิจิทัล` = authorization scope

## 4. Recommended Future Role Model

| Organizational position | Recommended future system role | Typical scope |
| --- | --- | --- |
| ผู้อำนวยการ / รองผู้อำนวยการ | `executive` | hospital-wide |
| หัวหน้ากลุ่มงาน | `department_manager` | department / workgroup |
| หัวหน้างาน / หัวหน้าหน่วย | `unit_manager` | unit / team |
| เจ้าหน้าที่ทั่วไป / ผู้รับผิดชอบ KPI | `staff_editor` | assigned KPI / own unit |
| ผู้ดูอย่างเดียว / คณะกรรมการบางชุด | `viewer` | assigned scope |
| IT ผู้ดูแลระบบ | `system_admin` | system administration scope |

## 5. Current Pilot Mapping

The current controlled rehearsal still uses the existing pilot roles only:

- `viewer`
- `editor`
- `manager`
- `admin`

Current real-world-to-pilot mapping is temporary:

| Real-world position | Current pilot role |
| --- | --- |
| ผู้อำนวยการ | `viewer` |
| หัวหน้ากลุ่มงาน | `manager` |
| หัวหน้างาน | `manager` or `editor` depending on responsibility |
| เจ้าหน้าที่ทั่วไป | `editor` |
| IT admin | `admin` |

This is a temporary pilot mapping only.

It is not the final production authorization model.

## 6. Future Role Semantics

### `executive`

Intended for directors and senior executives.

Should be able to do in the future:

- read high-level dashboards
- drill down according to permission and scope
- review KPI status
- review trend, achievement, and risk
- export summaries

Should not do by default:

- enter raw KPI values on behalf of operational owners
- edit `actual_value`, `progress_value`, or `note`
- become `system_admin` automatically

### `department_manager`

Intended for department or workgroup heads.

Should be able to do in the future:

- read KPI data for the department scope
- review, return, or approve KPI data within scope
- read dashboards for the department scope
- lock or confirm certain items where workflow policy allows

### `unit_manager`

Intended for unit or team leads.

Should be able to do in the future:

- read KPI data for the unit scope
- review values entered by staff
- comment, return, or forward items
- update certain fields only within the assigned scope

### `staff_editor`

Intended for operational staff or KPI owners.

Should be able to do in the future:

- see their own worklist
- enter `actual_value`
- enter `progress_value`
- enter `note`
- submit KPI data within the reporting cycle

Should not do by default:

- approve their own KPI
- lock their own KPI
- override target values
- change owner or due date without additional permission

### `viewer`

Intended for read-only use.

Should be able to do in the future:

- read KPI data
- read dashboards
- export or view reports according to scope

Should not mutate KPI data.

### `system_admin`

Intended for IT or system administration.

Should be able to do in the future:

- manage users
- manage roles and permissions
- manage system configuration
- manage technical and administrative operations

Important distinction:

`system_admin` is not the same as `executive`.

IT administrators should not automatically approve business KPI data unless they are explicitly assigned an additional business role.

## 7. Future Permission Candidates

Future phases may introduce a more granular permission model such as:

- `kpi.read`
- `kpi.update_value`
- `kpi.submit`
- `kpi.review`
- `kpi.return`
- `kpi.approve`
- `kpi.lock`
- `kpi.assign`
- `kpi.change_due_date`
- `kpi.override`
- `dashboard.read`
- `dashboard.drilldown`
- `template.import`
- `operational_value.import`
- `user.manage`
- `role.manage`

These are requirement candidates only and are not implemented in the current release.

## 8. Future Workflow Concept

Future business workflow may evolve toward:

`staff_editor`
-> enters actual, progress, and note
-> submits

`unit_manager`
-> reviews unit-level data
-> returns or forwards

`department_manager`
-> reviews or approves department-level KPI
-> locks or confirms where workflow allows

`executive`
-> reads dashboard, trend, risk, and achievement views
-> drills down according to permission
-> does not mutate raw KPI values by default

`system_admin`
-> manages system configuration and access
-> does not act as a business approver by default

## 9. Role And Scope Examples

- `role = executive`
  `scope = hospital-wide`
- `role = department_manager`
  `scope = กลุ่มงานสุขภาพดิจิทัล`
- `role = unit_manager`
  `scope = งานสารสนเทศ`
- `role = staff_editor`
  `scope = KPI entries assigned to user`
- `role = system_admin`
  `scope = system-wide technical administration`

## 10. Pilot Scope Guard

The current controlled rehearsal still evaluates only the current pilot roles:

- `viewer`
- `editor`
- `manager`
- `admin`

Do not implement the future role model until all of the following exist:

- owner-led controlled rehearsal
- controlled pilot feedback
- feedback triage
- explicit scope decision

If rehearsal feedback mentions role-model expectations, record it as:

- `S4 observation`
- future role-model requirement

Exception:

If the current pilot authorization allows an unsafe behavior, such as a read-only user mutating data, log that as a real defect with appropriate severity.

## 11. Non-Goals For This Requirement Capture

This document does not authorize work to:

- add new roles in the database
- add new permissions in seed data
- change RBAC enforcement
- change login or auth behavior
- change KPI mutation behavior
- change API contracts
- change frontend route or UI behavior
- add dashboard implementation
- add import workflow
- add assignment or due-date workflow
- add migration or schema changes
