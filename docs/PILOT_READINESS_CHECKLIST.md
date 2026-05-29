# Pilot Readiness Checklist

**Checkpoint commit**: `9285764`
**Checkpoint message**: `docs: add pilot rehearsal log`
**Date**: `2026-05-29`
**Status**: `Ready for controlled pilot rehearsal package review`

## 1. Purpose

This checklist is the pre-rehearsal gate for the current operational KPI workflow. It confirms that the team can run a small controlled pilot rehearsal, capture evidence consistently, and decide go or no-go for rehearsal execution without expanding product scope.

This document is for:

- development team package review
- facilitator preparation
- controlled pilot rehearsal readiness confirmation

This document is not for:

- broad rollout approval
- new feature design approval
- bypassing backend validation, concurrency, or audit rules

## 2. Related Pilot Documents

Use this document together with:

- [PILOT_REHEARSAL_LOG.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_REHEARSAL_LOG.md)
- [PILOT_FEEDBACK_TRIAGE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_FEEDBACK_TRIAGE.md)
- [PILOT_DEFECT_TEMPLATE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_DEFECT_TEMPLATE.md)
- [PILOT_TESTER_BRIEF.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_TESTER_BRIEF.md)
- [CURRENT_HANDOFF.md](D:/home/github/healthcare-kpi-hub/docs/CURRENT_HANDOFF.md)

## 3. Current Scope Summary

The current baseline supports this conservative operational flow:

- login and logout with session-based authentication
- role and permission checks from SQLite
- navigation and worklist read flow
- hierarchy-aware KPI page detail
- KPI entry read-only detail
- conservative KPI entry mutation for approved fields only
- optimistic concurrency using `updated_at`
- stale-write protection
- service-layer semantic audit events
- frontend operational error helpers
- Thai-ready message mapping
- readable audit history summaries

Approved mutation fields in the current release:

- `status`
- `value.actual_value`
- `value.progress_value`
- `value.note`

Explicitly out of scope in this phase:

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

## 4. Environment Assumptions

- repo root: `D:\home\github\healthcare-kpi-hub`
- runtime: `Bun`
- local auth rehearsal baseline:
  - `NODE_ENV=development`
  - `AUTH_PROVIDER=dev`
  - `API_PORT=3015`
- local SQLite path:
  - `apps/api/data/app.db`
- seeded users and deterministic KPI data are available
- recommended browsers:
  - current Chromium-based browser
  - Firefox
- primary local verification environment:
  - Windows

Operational note:

- local dev auth is acceptable for controlled rehearsal preparation only
- it must not be treated as a production or broad-rollout baseline

## 5. Test User / Role Matrix

| Role | Seeded username | Primary purpose | Current expectation |
|---|---|---|---|
| `viewer` | `viewer.user` | read navigation, KPI page, KPI entry | cannot mutate |
| `editor` | `editor.user` | standard KPI value and status update flow | can mutate conservative fields |
| `manager` | `manager.user` | current manager baseline | currently shares `kpi.update` scope with editor |
| `admin` | `admin.user` | current admin baseline | can mutate the same conservative fields |

## 6. Scenario Readiness Checklist

Every scenario below should be understandable to a tester or facilitator before rehearsal execution starts.

| Scenario ID | Scenario | Expected result is clear | Actual result can be captured | Evidence can be attached | Defect severity can be recorded | Ready |
|---|---|---|---|---|---|---|
| R-01 | Login / logout | yes | yes | yes | yes | yes |
| R-02 | Viewer read-only behavior | yes | yes | yes | yes | yes |
| R-03 | Editor KPI update flow | yes | yes | yes | yes | yes |
| R-04 | Manager KPI update flow | yes | yes | yes | yes | yes |
| R-05 | Admin KPI update flow | yes | yes | yes | yes | yes |
| R-06 | KPI page navigation and hierarchy context | yes | yes | yes | yes | yes |
| R-07 | KPI entry detail review | yes | yes | yes | yes | yes |
| R-08 | Edit actual value / progress / note | yes | yes | yes | yes | yes |
| R-09 | Status transition review | yes | yes | yes | yes | yes |
| R-10 | Stale-write two-session scenario | yes | yes | yes | yes | yes |
| R-11 | Locked entry behavior | yes | yes | yes | yes | yes |
| R-12 | Invalid value rejection | yes | yes | yes | yes | yes |
| R-13 | Audit history review | yes | yes | yes | yes | yes |
| R-14 | Thai / English message review | yes | yes | yes | yes | yes |

## 7. Scenario Expectations Summary

| Scenario ID | Expected result summary |
|---|---|
| R-01 | Login works, logout revokes access, protected screens require login again |
| R-02 | Viewer can read but cannot mutate, and the restriction is understandable |
| R-03 | Editor can update approved fields and immediately see reflected data and audit history |
| R-04 | Manager currently behaves like editor for conservative mutation only |
| R-05 | Admin can mutate only within the same current conservative scope |
| R-06 | KPI page clearly shows navigation grouping and ownership hierarchy context |
| R-07 | KPI entry detail is understandable without reading raw technical payloads |
| R-08 | `actual_value`, `progress_value`, and `note` save correctly; disallowed fields are not offered |
| R-09 | Allowed status transitions are understandable and save correctly |
| R-10 | Second stale writer is blocked with a clear message and no overwrite occurs |
| R-11 | Locked entry mutation is rejected clearly and does not save |
| R-12 | Invalid values are rejected with understandable feedback and no invalid save |
| R-13 | Audit history makes actor, time, and changed fields understandable |
| R-14 | Current English messages are understandable and Thai-ready wording is reviewable |

## 8. Severity Rules

Use the same severity model across rehearsal, defect logging, and triage.

| Severity | Meaning | Typical example |
|---|---|---|
| `S1 blocker` | cannot continue the intended rehearsal flow or risk of incorrect data handling | login fails, valid save fails broadly, forbidden mutation is incorrectly allowed, data loss, missing audit after successful mutation |
| `S2 major` | core workflow works poorly enough that the pilot scope is at risk | stale-write handling is unclear, audit summary is misleading, role behavior contradicts expectation, important message is too confusing |
| `S3 minor` | workflow still works but clarity or usability should improve | wording issues, small layout problems, minor edit friction |
| `S4 observation` | not a defect in current pilot scope, but useful feedback | suggestion, training note, future enhancement request |

## 9. Evidence Capture Requirements

Every executed scenario should capture at least:

- scenario ID
- tester or facilitator name
- role used
- result: `pass`, `fail`, `blocked`, or `not-run`
- expected result summary
- actual result summary
- screenshot path or evidence reference when available
- linked defect ID if a defect was opened

Preferred capture locations:

- scenario rows in [PILOT_REHEARSAL_LOG.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_REHEARSAL_LOG.md)
- formal defect entries using [PILOT_DEFECT_TEMPLATE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_DEFECT_TEMPLATE.md)
- triage summary in [PILOT_FEEDBACK_TRIAGE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_FEEDBACK_TRIAGE.md)

## 10. Automated Baseline Verification

Commands expected before or during rehearsal prep:

- `bun run typecheck`
- `bun run test`
- `bun run lint`
- `bun run --cwd apps/api typecheck`
- `bun run --cwd apps/api test`
- `bun run --cwd apps/web typecheck`
- `bun run --cwd apps/web test`

Latest known baseline before this docs hardening pass:

- root typecheck: passed
- root test: passed
- `apps/api` typecheck: passed
- `apps/api` test: passed
- `apps/web` typecheck: passed
- `apps/web` test: passed

## 11. Operational Risks To Watch

- real operational tester feedback has not been collected yet
- `manager` and `editor` still share the same `kpi.update` permission in the current scope
- browser-driven manual flow coverage is still more important than helper-level test coverage for this phase
- Windows SQLite WAL and transient disk I/O behavior remains an operational observation

Mitigations:

- keep the rehearsal group small
- capture screenshots for confusing errors and audit states
- recreate local SQLite state if a pristine rehearsal baseline is needed
- keep the scope fixed to the current conservative KPI workflow

## 12. Go / No-Go Decision For Rehearsal Execution

Use this decision table during package review:

| Check | Status |
|---|---|
| tester brief is available | go |
| rehearsal log has executable scenarios R-01 to R-14 | go |
| expected results are clear enough for facilitators | go |
| actual result and evidence capture fields exist | go |
| severity model is defined | go |
| defect template is available | go |
| feedback triage template is available | go |
| broad rollout is not implied anywhere | go |
| out-of-scope feature expansion is not required before rehearsal | go |

Recommendation:

- **Go for controlled pilot rehearsal package review**
- move to rehearsal execution only after the team confirms facilitator readiness and tester logistics

## 13. Recommended Next Step

After this checklist passes:

1. brief testers with [PILOT_TESTER_BRIEF.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_TESTER_BRIEF.md)
2. execute scenarios in [PILOT_REHEARSAL_LOG.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_REHEARSAL_LOG.md)
3. record defects with [PILOT_DEFECT_TEMPLATE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_DEFECT_TEMPLATE.md)
4. triage results in [PILOT_FEEDBACK_TRIAGE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_FEEDBACK_TRIAGE.md)
