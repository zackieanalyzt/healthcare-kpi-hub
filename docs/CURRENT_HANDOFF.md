# Current Handoff

**Project**: `healthcare-kpi-hub`
**Current checkpoint**: `461fe11 docs: add MacBook Codex handoff`
**Previous baseline**: `792dd3d docs: capture hospital role and scope model`
**Earlier baseline**: `0705d7b docs: finalize controlled pilot rehearsal logistics`
**Date**: `2026-05-29`

## 1. Current Readiness Status

- `Ready for owner-led controlled rehearsal execution`
- not ready for broad rollout
- feedback must come before feature expansion
- dashboard visualization requirement is captured as a gated future capability
- hospital role and scope model is captured as a gated future capability
- current rehearsal type is `owner-led controlled rehearsal / internal dry run`
- current tester mapping is `T-01 = project owner / facilitator` across `viewer`, `editor`, `manager`, and `admin`
- this rehearsal validates workflow readiness before inviting additional operational testers
- this is not external operational user pilot feedback
- rehearsal date is `2026-05-29` with start `20:31` in `Asia/Bangkok (+07)` and expected duration `90 minutes`
- seed/test credentials are handled securely out-of-band and are not stored in repository documents
- owner-led dry run results: `14 pass / 0 fail / 0 blocked / 0 defects`

If checkpoint alignment, evidence capture, ownership fields, and tester scheduling are confirmed, this package can move to:

- `Ready for controlled pilot rehearsal execution pending tester scheduling`

## 2. Completed Capabilities

Current operational baseline:

- foundation, auth, and RBAC
- live MariaDB authentication verified
- local SQLite migrate and seed flow
- session persistence, logout, and session revoke
- `/api/me`
- `/api/navigation`
- `/api/worklist`
- `GET /api/kpi-pages/:pageId`
- `GET /api/kpi-entries/:entryId`
- `PATCH /api/kpi-entries/:entryId`
- conservative KPI entry mutation
- optimistic concurrency using `updated_at`
- stale-write protection
- service-layer semantic audit
- frontend error helper
- Thai-ready message mapping

## 3. Pilot Documents Available

- [PILOT_READINESS_CHECKLIST.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_READINESS_CHECKLIST.md)
- [PILOT_REHEARSAL_LOG.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_REHEARSAL_LOG.md)
- [PILOT_FEEDBACK_TRIAGE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_FEEDBACK_TRIAGE.md)
- [PILOT_DEFECT_TEMPLATE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_DEFECT_TEMPLATE.md)
- [PILOT_TESTER_BRIEF.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_TESTER_BRIEF.md)
- [MACBOOK_CODEX_HANDOFF.md](D:/home/github/healthcare-kpi-hub/docs/MACBOOK_CODEX_HANDOFF.md)
- [DASHBOARD_VISUALIZATION_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_VISUALIZATION_REQUIREMENTS.md)
- [ROLE_AND_SCOPE_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/ROLE_AND_SCOPE_REQUIREMENTS.md)

## 4. What Must Not Be Expanded Yet

Do not expand into these areas before pilot feedback triage:

- import workflow
- KPI template creation or import
- operational KPI value import
- dashboard or aggregation
- assignment editing
- due date editing
- target value editing
- `extra_json` editing
- unlock workflow
- node-scoped authorization
- advanced permission model
- realtime, notification, or async jobs
- broad rollout changes

Deferred requirement to remember:

- future KPI Template Import must support multiple formats including `.xlsx`, `.json`, `.csv`, and other appropriate validated formats
- Template Import affects `KPIDefinition`
- Operational KPI Value Import affects `KPIEntry` and `EntryValue`
- future import must not bypass workflow, validation, concurrency, or audit
- future dashboard visualization is a core product capability, but implementation is gated until controlled pilot rehearsal results and feedback triage are recorded
- owner-led rehearsal feedback adds a future requirement for an organization-first dashboard landing page with hierarchy drill-down
- future hospital role and authorization scope redesign is required, but implementation is gated until controlled pilot rehearsal results and feedback triage are recorded

## 5. Known Risks

- no real operational pilot feedback has been collected yet
- `manager` and `editor` still share the same `kpi.update` permission in the current scope
- audit readability is improved but still needs tester confirmation
- current pilot roles are intentionally simplified and are not the final hospital authorization model
- Windows SQLite WAL or disk I/O hiccups remain an operational observation
- seed data is a baseline, not a guaranteed full reset tool

## 6. Next Recommended Action

Recommended next action:

1. treat triage as completed for the owner-led dry run and keep the decision recorded in [PILOT_FEEDBACK_TRIAGE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_FEEDBACK_TRIAGE.md)
2. open `Dashboard and KPI Visualization Design Phase` only
3. keep scope guard active: no dashboard implementation, no chart library, no dashboard API, no aggregation service, and no landing page behavior change yet
4. keep role-model feedback and dashboard landing feedback as design inputs unless a future run exposes a real workflow safety defect

## 7. Copy/Paste Starter Text For Next Chat

```text
We are continuing healthcare-kpi-hub from checkpoint 461fe11 docs: add MacBook Codex handoff.

The system currently has foundation/auth/RBAC, hierarchy-aware KPI page read model, KPI entry detail, conservative KPI mutation, optimistic concurrency with updated_at, stale-write protection, service-layer semantic audit, Thai-ready message mapping, and a controlled pilot rehearsal documentation package.

Current status: Ready for owner-led controlled rehearsal execution, with dashboard visualization and hospital role-and-scope requirements captured as gated future capabilities. The current rehearsal is an owner-led controlled rehearsal / internal dry run using T-01 as project owner / facilitator across viewer, editor, manager, and admin. The owner-led dry run on 2026-05-29 passed all 14 scenarios with no defects opened. Do not expand into import, dashboard implementation, assignment, due-date, unlock workflow, or advanced permission changes before pilot feedback triage.
Current triage outcome recommends opening `Dashboard and KPI Visualization Design Phase` only. Dashboard implementation remains gated.

Dashboard visualization is a core future capability, but it remains gated until controlled pilot rehearsal results and feedback triage exist. See docs/DASHBOARD_VISUALIZATION_REQUIREMENTS.md.
The latest product feedback also requests an organization-first dashboard landing page with drill-down from organization to department, unit, and individual KPI detail. Capture this in docs and triage, but do not implement it during the current rehearsal pass.

Hospital authorization must eventually separate organizational position, system role, and hierarchy scope, but the current controlled rehearsal still uses only viewer/editor/manager/admin. See docs/ROLE_AND_SCOPE_REQUIREMENTS.md.

If continuing on another machine such as a MacBook, read docs/MACBOOK_CODEX_HANDOFF.md as well.

Please read docs/CURRENT_HANDOFF.md, docs/PILOT_READINESS_CHECKLIST.md, docs/PILOT_REHEARSAL_LOG.md, docs/PILOT_FEEDBACK_TRIAGE.md, docs/PILOT_DEFECT_TEMPLATE.md, and docs/PILOT_TESTER_BRIEF.md first, then help with owner-led controlled rehearsal execution or pilot feedback triage.
```
