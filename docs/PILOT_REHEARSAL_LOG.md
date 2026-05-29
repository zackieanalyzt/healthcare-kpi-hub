# Pilot Rehearsal Log

**Purpose**: Controlled pilot rehearsal execution and structured feedback capture for the current conservative KPI workflow
**Commit under test**: `461fe11`
**Commit message**: `docs: add MacBook Codex handoff`
**Previous baseline**: `792dd3d docs: capture hospital role and scope model`
**Earlier baseline**: `0705d7b docs: finalize controlled pilot rehearsal logistics`
**Date prepared**: `2026-05-29`
**Rehearsal status**: `Ready for owner-led controlled rehearsal preparation`
**Rehearsal package committed as**: `461fe11 docs: add MacBook Codex handoff`

Preparation note:

- this document is a facilitator guide plus execution log
- it supports tester evidence capture and later triage
- it does not claim that broad rollout is approved
- it does not authorize feature expansion before feedback triage
- this pass is an `owner-led controlled rehearsal / internal dry run`
- `T-01` is the project owner / facilitator and covers `viewer`, `editor`, `manager`, and `admin`
- this pass validates workflow readiness before inviting additional operational testers
- this is not external operational user pilot feedback

## 1. Related Pilot Documents

Use this log with:

- [PILOT_READINESS_CHECKLIST.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_READINESS_CHECKLIST.md)
- [PILOT_DEFECT_TEMPLATE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_DEFECT_TEMPLATE.md)
- [PILOT_FEEDBACK_TRIAGE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_FEEDBACK_TRIAGE.md)
- [PILOT_TESTER_BRIEF.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_TESTER_BRIEF.md)
- [CURRENT_HANDOFF.md](D:/home/github/healthcare-kpi-hub/docs/CURRENT_HANDOFF.md)

## 2. Rehearsal Purpose

This rehearsal validates the current operational KPI workflow only:

- login and logout flow
- role expectations for `viewer`, `editor`, `manager`, and `admin`
- KPI page navigation and hierarchy context
- KPI entry detail comprehension
- conservative KPI mutation behavior
- stale-write comprehension
- audit history readability
- user-facing error clarity
- Thai-ready wording direction

Not in scope for this rehearsal:

- import workflow
- KPI template creation or import
- operational KPI value import
- dashboard or aggregation
- assignment editing
- due date editing
- target value editing
- `extra_json` editing
- unlock workflow
- advanced permission redesign

Scope reminder:

- dashboard requests during rehearsal belong in `S4 observation` or future request handling
- hospital role-model requests during rehearsal belong in `S4 observation` or future role-model requirement handling unless the current pilot authorization is unsafe

## 3. Environment

| Field | Value |
|---|---|
| repo root | `D:\home\github\healthcare-kpi-hub` |
| backend runtime | `Bun` |
| frontend runtime | `Vite` |
| backend env for local rehearsal | `NODE_ENV=development`, `AUTH_PROVIDER=dev` |
| recommended local API port | `3015` |
| data store | local SQLite app database |
| target commit baseline | `461fe11` |
| rehearsal audience | project owner internal dry run first, then additional internal testers if approved |

Notes:

- use seeded local development users
- do not treat dev auth as a production baseline
- if a pristine state is required, recreate the ignored local SQLite database and rerun migrate and seed

## 4. Logistics Ownership

Fill these fields before rehearsal execution:

| Field | Value |
|---|---|
| Facilitator | Project owner / facilitator |
| Rehearsal log owner | Project owner / facilitator |
| Evidence owner | Project owner initial capture |
| Defect log owner | Project owner initial capture |
| Triage owner | Project owner |
| Decision owner | Project owner and steering reviewer |

## 5. Evidence And Defect Conventions

Defect ID format:

- `PILOT-001`, `PILOT-002`, `PILOT-003`, and so on
- use a three-digit running number
- do not reuse a previous defect ID
- open one defect record per distinct defect
- log suggestions and future feature requests as feedback or `S4 observation` unless they affect workflow safety or pilot comprehension

Examples:

- `PILOT-001: R-10 stale-write message is unclear for editor user`
- `PILOT-002: R-13 audit history wording is misleading`

Actual evidence location for the current rehearsal package:

- external or private evidence folder: `pilot-evidence/2026-05-29/`
- record only the evidence path or reference in this rehearsal log
- use repo-local naming `docs/pilot-evidence/2026-05-29/` only for sanitized evidence that is safe to keep in git

Screenshot naming convention:

- `R-<scenario>-<tester-label>-<role>-<short-topic>.png`

Examples:

- `docs/pilot-evidence/2026-05-29/R-03-T-01-editor-update-flow.png`
- `docs/pilot-evidence/2026-05-29/R-10-T-01-editor-stale-write.png`
- `docs/pilot-evidence/2026-05-29/R-13-T-01-manager-audit-history.png`

Evidence handling note:

- evidence files may be stored outside git if they contain sensitive or operational data
- if evidence is stored outside git, record only the evidence path or reference in this rehearsal log
- do not capture passwords, session tokens, real patient data, or unnecessary personal information
- redact or mask sensitive information before sharing screenshots
- dashboard requests during rehearsal belong in `S4 observation` or `future request`, not in implementation scope

## 6. Participants

Populate before rehearsal. Avoid sensitive personal details.

| Tester label | Work context | Test role | Browser | Notes |
|---|---|---|---|---|
| T-01 | project owner / facilitator | viewer | MacBook desktop browser | owner-led internal dry run |
| T-01 | project owner / facilitator | editor | MacBook desktop browser | owner-led internal dry run |
| T-01 | project owner / facilitator | manager | MacBook desktop browser | owner-led internal dry run |
| T-01 | project owner / facilitator | admin | MacBook desktop browser | owner-led internal dry run |

Seeded roles available for local rehearsal:

| Role | Seeded username | Expected mutation behavior |
|---|---|---|
| `viewer` | `viewer.user` | read-only |
| `editor` | `editor.user` | conservative mutation allowed |
| `manager` | `manager.user` | same current `kpi.update` baseline as editor |
| `admin` | `admin.user` | conservative mutation allowed |

## 7. Scenario Execution Summary Table

Use one row per executed scenario. Valid results:

- `pass`
- `fail`
- `blocked`
- `not-run`

| Scenario ID | Scenario | Tester label | Role | Expected result summary | Actual result summary | Result | Evidence path / screenshot | Defect ID | Severity | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| R-01 | Login / logout | | | Login works, logout revokes access | | | | | | |
| R-02 | Viewer read-only behavior | | | Viewer can read but cannot mutate | | | | | | |
| R-03 | Editor KPI update flow | | | Editor can update approved fields and see audit history | | | | | | |
| R-04 | Manager KPI update flow | | | Manager currently behaves like editor for conservative mutation | | | | | | |
| R-05 | Admin KPI update flow | | | Admin can mutate only within the same conservative scope | | | | | | |
| R-06 | KPI page navigation and hierarchy context | | | KPI page context is understandable | | | | | | |
| R-07 | KPI entry detail review | | | Entry detail and history are understandable | | | | | | |
| R-08 | Edit actual value / progress / note | | | Approved fields save correctly | | | | | | |
| R-09 | Status transition review | | | Allowed status transitions are clear and save correctly | | | | | | |
| R-10 | Stale-write two-session scenario | | | Second stale writer is blocked without overwrite | | | | | | |
| R-11 | Locked entry rejection | | | Locked entry mutation is rejected clearly | | | | | | |
| R-12 | Invalid value rejection | | | Invalid value is rejected with understandable feedback | | | | | | |
| R-13 | Audit history review | | | Actor, time, and changed fields are understandable | | | | | | |
| R-14 | Thai / English message review | | | English and Thai-ready wording are understandable | | | | | | |

## 8. Rehearsal Script

### R-01 Login / Logout

Steps:

1. Open the login page.
2. Sign in with the provided account.
3. Confirm the application loads normally after login.
4. Open the current-user area or confirm the signed-in user from the UI.
5. Logout.
6. Try to reopen a protected screen without signing in again.

Expected result:

- login succeeds
- the user enters the application successfully
- logout returns the user to an unauthenticated state
- protected screens require login again

Capture:

- actual result summary
- screenshot if login or logout behavior is unclear
- defect ID if this fails

### R-02 Viewer Read-Only Behavior

Steps:

1. Login as `viewer.user`.
2. Open navigation.
3. Open a KPI page.
4. Open a KPI entry.
5. Confirm edit actions are unavailable or blocked.
6. If needed, use facilitator assistance to confirm mutation is forbidden.

Expected result:

- viewer can navigate and inspect KPI data
- viewer cannot edit KPI entries
- forbidden behavior is communicated clearly

Capture:

- actual result summary
- screenshot of blocked edit state or message
- defect ID if viewer can mutate or the message is misleading

### R-03 Editor KPI Update Flow

Steps:

1. Login as `editor.user`.
2. Open the BI Team KPI page.
3. Open an editable KPI entry.
4. Enter edit mode.
5. Change one or more approved fields:
   - `actual_value`
   - `progress_value`
   - `note`
   - `status`
6. Save the change.
7. Review updated entry detail and audit history.

Expected result:

- save succeeds
- updated values appear after refresh or save completion
- audit history reflects the change
- `updated_at` and actor context update appropriately

Capture:

- actual result summary
- screenshot before and after save if useful
- defect ID if valid save fails or audit is missing

### R-04 Manager KPI Update Flow

Steps:

1. Login as `manager.user`.
2. Open an editable KPI entry.
3. Update an approved field.
4. Save.
5. Review the audit history entry.

Expected result:

- manager can mutate with the same current `kpi.update` behavior as editor
- audit records the manager as actor

Capture:

- actual result summary
- screenshot of updated state or error
- defect ID if manager behavior differs unexpectedly

### R-05 Admin KPI Update Flow

Steps:

1. Login as `admin.user`.
2. Open an editable KPI entry.
3. Update an approved field.
4. Save.
5. Review the audit history entry.

Expected result:

- admin can mutate only within the same current conservative scope
- no extra mutation fields appear in the UI

Capture:

- actual result summary
- screenshot if an unexpected control appears
- defect ID if admin cannot complete the same conservative flow

### R-06 KPI Page Navigation and Hierarchy Context

Steps:

1. Open navigation.
2. Open a hierarchy-aware KPI page.
3. Review:
   - page name
   - hierarchy level
   - current owner
   - parent node
   - child node count
   - assigned KPI items
4. Follow one page-to-entry link.

Expected result:

- navigation grouping and ownership hierarchy are understandable
- page-to-entry link works
- page context helps the tester understand where the KPI belongs

Capture:

- actual result summary
- screenshot of page context
- defect ID if context is misleading

### R-07 KPI Entry Detail Review

Steps:

1. Open a KPI entry.
2. Review:
   - KPI code and name
   - reporting period
   - workflow status
   - value block
   - page context
   - hierarchy context
   - recent history

Expected result:

- the tester can understand what the KPI is and which period it belongs to
- the tester can understand who changed it and what changed
- no raw JSON is needed for the primary explanation

Capture:

- actual result summary
- note any confusion about labels or audit wording
- defect ID if key context is missing or misleading

### R-08 Edit Actual Value / Progress / Note

Steps:

1. Open an editable KPI entry.
2. Enter edit mode.
3. Change `actual_value`.
4. Change `progress_value`.
5. Change `note`.
6. Save.
7. Review the refreshed detail screen.

Expected result:

- all three approved value fields save correctly
- refreshed detail reflects the saved values
- disallowed fields do not appear as editable controls

Capture:

- actual result summary
- screenshot if form layout or save behavior is confusing
- defect ID if a valid field fails or a disallowed field appears

### R-09 Status Transition Review

Steps:

1. Open an editable KPI entry in a suitable starting state.
2. Change status through the current workflow.
3. Save.
4. Review the updated detail and audit history.

Expected result:

- only allowed transitions are possible:
  - `draft -> pending`
  - `pending -> submitted`
  - `submitted -> pending`
  - `draft -> locked`
  - `pending -> locked`
  - `submitted -> locked`
- resulting status is understandable in the UI
- audit history reflects the transition

Capture:

- actual result summary
- screenshot if transition wording is unclear
- defect ID if a disallowed transition is allowed or expected transition fails

### R-10 Stale-Write Two-Session Scenario

Steps:

1. Open the same editable KPI entry in Browser A and Browser B.
2. Save a valid change in Browser A.
3. Without refreshing Browser B, save a different valid change in Browser B.

Expected result:

- Browser B receives a clear stale-write message
- Browser B does not silently overwrite Browser A
- no stale audit event is created for the rejected second save

Capture:

- actual result summary
- screenshots from both sessions if possible
- defect ID if data is overwritten or the message is unclear

### R-11 Locked Entry Behavior

Steps:

1. Open a seeded locked entry.
2. Attempt a mutation.

Expected result:

- mutation is rejected
- locked-entry message is understandable
- no successful save occurs

Capture:

- actual result summary
- screenshot of locked-entry message
- defect ID if the lock is bypassed or the message is misleading

### R-12 Invalid Value Behavior

Steps:

1. Enter an invalid `progress_value`.
2. Attempt save.
3. If useful, try a value that violates the current KPI rule baseline.

Expected result:

- mutation is rejected
- validation feedback is understandable
- no invalid value is persisted

Capture:

- actual result summary
- screenshot of validation feedback
- defect ID if invalid data saves or error wording is unusable

### R-13 Audit History Review

Steps:

1. Review recent history after a value update.
2. Review history after a status-related update.
3. Review a combined change if available.

Expected result:

- actor is visible
- timestamp is visible
- changed fields are understandable
- old and new summaries are readable where present

Capture:

- actual result summary
- screenshot of audit history cards
- defect ID if history is too technical or misleading

### R-14 Thai / English Message Review

Steps:

1. Review current English operational messages in the UI.
2. Review Thai-ready wording with Thai-speaking reviewers where available.
3. Identify wording that is too technical, ambiguous, or missing a clear next step.

Expected result:

- English default is operationally clear
- Thai-ready wording is understandable and usable for future wiring

Capture:

- actual result summary
- wording suggestions
- defect ID only if the issue materially affects pilot understanding

## 9. Feedback Capture Table

Use one row per meaningful tester comment.

| Tester label / role | Work context | Scenario | Type | What was clear | What was confusing | Suggested wording or change | Severity | Follow-up needed |
|---|---|---|---|---|---|---|---|---|
| | | | defect / suggestion / training note | | | | S1 / S2 / S3 / S4 | yes / no |

## 10. Defect / Issue Table

Severity reference:

- `S1 blocker`
- `S2 major`
- `S3 minor`
- `S4 observation`

Open a formal record using [PILOT_DEFECT_TEMPLATE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_DEFECT_TEMPLATE.md) for every meaningful defect.

| Defect ID | Severity | Scenario | Summary | Suspected area | Triage decision | Owner | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| | S1 / S2 / S3 / S4 | | | | fix before pilot / fix after pilot / documentation only / not a defect / needs design decision | | open / triaged / resolved | |

## 11. Tester Logistics Readiness

Complete before the first live tester session:

| Item | Status | Notes |
|---|---|---|
| tester list confirmed | ready | `T-01` project owner / facilitator confirmed for internal dry run |
| tester role assigned | ready | `T-01` covers `viewer`, `editor`, `manager`, and `admin` |
| browser and device confirmed | ready | MacBook desktop browser baseline for owner-led rehearsal |
| rehearsal date and time confirmed | not ready | waiting for tester scheduling |
| facilitator confirmed | ready | project owner / facilitator |
| evidence capture owner confirmed | ready | project owner initial evidence capture |
| defect ID convention confirmed | ready | `PILOT-001`, `PILOT-002`, `PILOT-003` |
| triage owner confirmed | ready | project owner |
| seed and test user credentials distributed securely | not ready | credentials are handled out-of-band and are not stored in repository documents |
| scope reminder delivered | ready | owner-led dry-run scope is documented and broad rollout is explicitly excluded |

## 12. Rehearsal Execution Summary

Populate after the rehearsal session:

| Field | Value |
|---|---|
| rehearsal date | |
| facilitator | |
| rehearsal log owner | |
| evidence owner | |
| defect log owner | |
| total scenarios run | |
| pass count | |
| fail count | |
| blocked count | |
| defects opened | |
| S1 count | |
| S2 count | |
| S3 count | |
| S4 count | |
| recommended outcome | |

## 13. Go / No-Go Summary

Use this section for the immediate rehearsal outcome:

- `go`
- `go with follow-up`
- `no-go`

Decision guidance:

- use `go` when the core conservative KPI workflow is understandable and no blocking issue appears
- use `go with follow-up` when only wording, audit presentation, or minor usability refinements are needed
- use `no-go` when S1 or unresolved S2 issues make the rehearsal outcome unreliable

Current preparation recommendation:

- **Go for controlled pilot rehearsal package review**
- conditions:
  - keep scope limited to the current conservative KPI workflow
  - capture screenshots and defect IDs for confusing states
  - move to execution only after facilitator readiness and tester logistics are confirmed
  - send results to [PILOT_FEEDBACK_TRIAGE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_FEEDBACK_TRIAGE.md)

## 14. Local Baseline Notes

Known preparation baseline before external tester execution:

- local facilitator smoke verified login, read flow, mutation, stale-write handling, and audit generation
- browser-based real tester walkthrough remains pending
- no external operational tester feedback has been recorded yet

## 15. Windows SQLite Observation

Observation status:

- transient Windows SQLite WAL or disk I/O behavior remains an operational observation
- it is not currently treated as a confirmed logic defect

If it reappears, record:

- exact command
- whether rerun passed
- whether file watchers, antivirus, sync folders, or another process may have held the database

Mitigation guidance:

- avoid synced folders where possible
- ensure no process is holding the SQLite file
- recreate the ignored local SQLite database and rerun migrate and seed if a clean rehearsal baseline is needed
