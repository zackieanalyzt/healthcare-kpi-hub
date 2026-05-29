# Current Handoff

**Project**: `healthcare-kpi-hub`
**Current checkpoint**: `82fc153 docs: harden controlled pilot rehearsal package`
**Previous baseline**: `9285764 docs: add pilot rehearsal log`
**Date**: `2026-05-29`

## 1. Current Readiness Status

- `Ready for controlled pilot rehearsal package review`
- not ready for broad rollout
- feedback must come before feature expansion

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

## 5. Known Risks

- no real operational pilot feedback has been collected yet
- `manager` and `editor` still share the same `kpi.update` permission in the current scope
- audit readability is improved but still needs tester confirmation
- Windows SQLite WAL or disk I/O hiccups remain an operational observation
- seed data is a baseline, not a guaranteed full reset tool

## 6. Next Recommended Action

Recommended next action:

1. align pilot logistics fields and conventions in the rehearsal docs
2. confirm facilitator, rehearsal log owner, evidence owner, defect log owner, triage owner, and decision owner
3. brief testers using [PILOT_TESTER_BRIEF.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_TESTER_BRIEF.md)
4. execute scenarios R-01 through R-14 in [PILOT_REHEARSAL_LOG.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_REHEARSAL_LOG.md)
5. log defects with [PILOT_DEFECT_TEMPLATE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_DEFECT_TEMPLATE.md)
6. triage results in [PILOT_FEEDBACK_TRIAGE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_FEEDBACK_TRIAGE.md)

## 7. Copy/Paste Starter Text For Next Chat

```text
We are continuing healthcare-kpi-hub from checkpoint 82fc153 docs: harden controlled pilot rehearsal package.

The system currently has foundation/auth/RBAC, hierarchy-aware KPI page read model, KPI entry detail, conservative KPI mutation, optimistic concurrency with updated_at, stale-write protection, service-layer semantic audit, Thai-ready message mapping, and a controlled pilot rehearsal documentation package.

Current status: Ready for controlled pilot rehearsal package review, not broad rollout. Do not expand into import, dashboard, assignment, due-date, unlock workflow, or advanced permission changes before pilot feedback triage.

Please read docs/CURRENT_HANDOFF.md, docs/PILOT_READINESS_CHECKLIST.md, docs/PILOT_REHEARSAL_LOG.md, docs/PILOT_FEEDBACK_TRIAGE.md, docs/PILOT_DEFECT_TEMPLATE.md, and docs/PILOT_TESTER_BRIEF.md first, then help with controlled pilot rehearsal execution or pilot feedback triage.
```
