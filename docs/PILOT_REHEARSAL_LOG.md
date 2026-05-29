# Pilot Rehearsal Log

**Purpose**: Controlled pilot rehearsal preparation and feedback capture for the current conservative KPI workflow
**Commit under test**: `73af7cbf8c1e6c6f0a6d9a9c8a2e7b4d5f1c2a3b`
**Commit message**: `docs: add pilot readiness checklist`
**Date prepared**: `2026-05-29`
**Rehearsal status**: `prepared for controlled pilot rehearsal`

Preparation note:

- this pass prepares the rehearsal package and captures local facilitator smoke evidence
- it does **not** claim that real operational pilot testers have already completed the rehearsal

## 1. Rehearsal Purpose

This document is the execution log and facilitator guide for a controlled pilot rehearsal of the currently approved KPI workflow.

The rehearsal is intended to validate:

- login and logout flow
- role expectations for `viewer`, `editor`, `manager`, and `admin`
- KPI page navigation and hierarchy context
- KPI entry read-only comprehension
- conservative KPI mutation behavior
- stale-write comprehension
- audit history readability
- user-facing mutation error clarity
- Thai-ready wording direction

This rehearsal does **not** introduce new functionality. It validates the current frozen scope only.

## 2. Environment

| Field | Value |
|---|---|
| repo root | `D:\home\github\healthcare-kpi-hub` |
| backend runtime | `Bun` |
| frontend runtime | `Vite` |
| backend env for local rehearsal | `NODE_ENV=development`, `AUTH_PROVIDER=dev` |
| recommended local API port | `3015` |
| data store | local SQLite app database |
| target commit | `73af7cbf8c1e6c6f0a6d9a9c8a2e7b4d5f1c2a3b` |
| rehearsal audience | internal pilot testers only |

Notes:

- use the seeded local development users for rehearsal
- do not treat the local development auth mode as a production baseline
- if a pristine data state is required, recreate the ignored local SQLite database and rerun migrate/seed before starting

## 3. Tester List / Role List

Populate before rehearsal:

| Tester | Work context / department | Test role | Browser | Notes |
|---|---|---|---|---|
| | | viewer | | |
| | | editor | | |
| | | manager | | |
| | | admin | | |

Seeded roles available for local rehearsal:

| Role | Seeded username | Expected mutation behavior |
|---|---|---|
| viewer | `viewer.user` | read-only |
| editor | `editor.user` | conservative mutation allowed |
| manager | `manager.user` | same `kpi.update` baseline as editor |
| admin | `admin.user` | conservative mutation allowed |

## 4. Scenario Execution Table

Use one row per executed scenario. Recommended statuses:

- `pass`
- `fail`
- `blocked`
- `not-run`

| Scenario ID | Scenario | Tester | Role | Result | Evidence path / screenshot | Issue ID | Notes |
|---|---|---|---|---|---|---|---|
| R-01 | Login / logout | | | | | | |
| R-02 | Viewer read-only behavior | | | | | | |
| R-03 | Editor KPI update flow | | | | | | |
| R-04 | Manager KPI update flow | | | | | | |
| R-05 | Admin KPI update flow | | | | | | |
| R-06 | KPI page navigation and hierarchy context | | | | | | |
| R-07 | KPI entry detail review | | | | | | |
| R-08 | Edit actual value / progress / note | | | | | | |
| R-09 | Status transition review | | | | | | |
| R-10 | Stale-write two-session scenario | | | | | | |
| R-11 | Locked entry rejection | | | | | | |
| R-12 | Invalid value rejection | | | | | | |
| R-13 | Audit history review | | | | | | |
| R-14 | Thai / English message review | | | | | | |

## 5. Rehearsal Script for Testers

### R-01 Login / Logout

Steps:

1. Open the application login page.
2. Sign in with the provided test account.
3. Confirm the application opens normally after login.
4. Open the current-user area or verify current user from the UI.
5. Logout.
6. Attempt to reopen a protected screen without logging in again.

Expected result:

- login succeeds
- the user is taken into the application
- logout returns the user to an unauthenticated state
- protected screens require login again

Tester observation:

- what was clear:
- what was confusing:
- wording issue:
- pass / fail / blocked:
- evidence path:
- issue id:

### R-02 Viewer Read-Only Behavior

Steps:

1. Login as `viewer.user`.
2. Open navigation.
3. Open a KPI page.
4. Open a KPI entry.
5. Check whether edit actions are unavailable.
6. If possible, attempt a mutate action through the UI or facilitator-assisted API call.

Expected result:

- viewer can navigate and inspect KPI data
- viewer cannot edit KPI entries
- forbidden behavior is communicated clearly

Tester observation:

- what was clear:
- what was confusing:
- role expectation matched or not:
- pass / fail / blocked:
- evidence path:
- issue id:

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
6. Save the changes.
7. Review the updated entry detail and audit card.

Expected result:

- save succeeds
- updated values appear immediately
- audit history reflects the change
- `updated_at` and `updated_by` change appropriately

Tester observation:

- what was clear:
- what was confusing:
- data-entry friction:
- pass / fail / blocked:
- evidence path:
- issue id:

### R-04 Manager KPI Update Flow

Steps:

1. Login as `manager.user`.
2. Open a KPI entry assigned to another user or a general entry.
3. Update an approved field.
4. Save.
5. Review the audit card.

Expected result:

- manager can mutate with the same current `kpi.update` behavior as editor
- audit records the manager as actor

Tester observation:

- role expectation matched or not:
- pass / fail / blocked:
- evidence path:
- issue id:

### R-05 Admin KPI Update Flow

Steps:

1. Login as `admin.user`.
2. Open a KPI entry.
3. Update an approved field.
4. Save.
5. Review the audit card.

Expected result:

- admin can mutate within the same current conservative scope
- no extra mutation fields appear

Tester observation:

- role expectation matched or not:
- pass / fail / blocked:
- evidence path:
- issue id:

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

Expected result:

- the KPI page shows both navigation grouping and ownership hierarchy context
- page-to-entry links are understandable

Tester observation:

- hierarchy clarity:
- page clarity:
- pass / fail / blocked:
- evidence path:
- issue id:

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

- operational users can understand what this KPI is, which period it belongs to, and who changed it
- no raw JSON is needed to understand the audit card

Tester observation:

- what was clear:
- what was confusing:
- audit/history issue:
- pass / fail / blocked:
- evidence path:
- issue id:

### R-08 Edit Actual Value / Progress / Note

Steps:

1. Open an editable KPI entry.
2. Enter edit mode.
3. Change `actual_value`.
4. Change `progress_value`.
5. Change `note`.
6. Save.
7. Reopen or review the refreshed detail screen.

Expected result:

- all three approved value fields save correctly
- no disallowed fields appear in the form

Tester observation:

- data-entry clarity:
- save clarity:
- pass / fail / blocked:
- evidence path:
- issue id:

### R-09 Status Transition Review

Steps:

1. Open an editable KPI entry.
2. Enter edit mode.
3. Review the available status options.
4. Attempt one allowed transition.
5. Save.

Expected result:

- allowed options are consistent with current workflow policy
- invalid or unsupported transitions are not silently accepted

Tester observation:

- status wording clarity:
- status expectation matched or not:
- pass / fail / blocked:
- evidence path:
- issue id:

### R-10 Stale-Write Two-Session Scenario

Steps:

1. Open the same KPI entry in Browser A.
2. Open the same KPI entry in Browser B.
3. Change and save in Browser A.
4. Without refresh, change and save in Browser B.

Expected result:

- Browser B receives a clear stale-write message
- Browser B does not silently overwrite Browser A
- no second stale audit event is created

Tester observation:

- stale-write message clarity:
- next-step clarity:
- pass / fail / blocked:
- evidence path:
- issue id:

### R-11 Locked Entry Behavior

Steps:

1. Open a seeded locked entry.
2. Attempt a mutation.

Expected result:

- mutation is rejected
- locked-entry message is understandable
- no successful save occurs

Tester observation:

- message clarity:
- pass / fail / blocked:
- evidence path:
- issue id:

### R-12 Invalid Value Behavior

Steps:

1. Enter an invalid `progress_value`.
2. Attempt save.
3. If available, try a value that violates the current KPI rule baseline.

Expected result:

- mutation is rejected
- validation feedback is understandable
- no invalid value is persisted

Tester observation:

- validation clarity:
- wording issue:
- pass / fail / blocked:
- evidence path:
- issue id:

### R-13 Audit History Review

Steps:

1. Review recent history cards after a value update.
2. Review recent history cards after a status-related update.
3. Review a combined change if available.

Expected result:

- actor is visible
- timestamp is visible
- changed fields are understandable
- old/new summaries are readable where present

Tester observation:

- what was clear:
- what was confusing:
- audit/history issue:
- pass / fail / blocked:
- evidence path:
- issue id:

### R-14 Thai / English Message Review

Steps:

1. Review current English operational messages in the UI.
2. Review Thai-ready message wording with Thai-speaking reviewers using the documented mappings.
3. Identify wording that sounds too technical or ambiguous.

Expected result:

- English default is operationally clear
- Thai wording is understandable and suitable for future UI wiring

Tester observation:

- wording issue:
- preferred phrase:
- severity:
- pass / fail / blocked:
- evidence path:
- issue id:

## 6. Feedback Capture Table

Use one row per meaningful tester comment.

| Tester name / role | Department / work context | Scenario | What was clear | What was confusing | Wording issue | Audit/history issue | Data-entry issue | Severity | Suggested improvement | Follow-up needed |
|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | S1 / S2 / S3 / S4 | | yes / no |

## 7. Defect / Issue Table

### Severity Rules

- `S1 blocker`
  - cannot login
  - cannot save valid KPI update
  - forbidden mutation is allowed incorrectly
  - data loss
  - audit missing after successful mutation
- `S2 major`
  - stale-write behavior is unclear
  - audit history is misleading
  - an important error message is confusing
  - role behavior contradicts pilot expectation
- `S3 minor`
  - wording improvement
  - layout issue
  - minor usability friction
- `S4 observation`
  - user suggestion
  - future enhancement
  - training note

| Issue ID | Severity | Scenario | Summary | Repro steps | Owner | Status | Notes |
|---|---|---|---|---|---|---|---|
| | S1 / S2 / S3 / S4 | | | | | open / triaged / resolved | |

## 8. Wording Feedback

Capture wording feedback here after the rehearsal.

Suggested prompts for reviewers:

- Which message sounded too technical?
- Which message needed a clearer next action?
- Which Thai phrase should be changed before broader pilot use?
- Which status or audit wording was unclear?

### Findings

- none recorded yet

## 9. Audit Readability Feedback

Prompts:

- Could you tell who changed the KPI?
- Could you tell what changed without reading raw technical terms?
- Was the before/after summary useful?
- Was the combined “updated and submitted” style understandable?

### Findings

- none recorded yet

## 10. Stale-Write Feedback

Prompts:

- Did the user understand that another person changed the entry first?
- Was it clear what to do next?
- Did the stale-write message feel blocking but understandable?

### Findings

- none recorded yet

## 11. Role / Permission Feedback

Prompts:

- Did viewer behavior match expectations?
- Did editor/manager/admin behavior match expectations?
- Did anyone expect manager/admin to have different controls from editor?

### Findings

- none recorded yet

## 12. Automated Baseline Check

Commands to run before rehearsal:

- `bun run --cwd apps/api typecheck`
- `bun run --cwd apps/web typecheck`
- `bun run typecheck`
- `bun run --cwd apps/api test`
- `bun run --cwd apps/web test`
- `bun run test`
- `bun run db:migrate`
- `bun run db:seed`
- `git diff --check`
- `git status --short`

Recorded results for preparation pass on `2026-05-29`:

- `apps/api` typecheck: passed
- `apps/web` typecheck: passed
- root typecheck: passed
- `apps/api` tests: `75 pass / 0 fail`
- `apps/web` tests: `8 pass / 0 fail`
- root tests:
  - API `75 pass / 0 fail`
  - Web `8 pass / 0 fail`
- `db:migrate`: passed, `applied_count: 0`
- `db:seed`: passed, `applied_count: 4`
- `git diff --check`: passed
- `git status --short`: clean before this documentation change

## 13. Optional Local Smoke Results

Local smoke was executed during rehearsal preparation.

Observed results:

- login succeeded
- `/api/me` succeeded
- KPI page fetch succeeded
- KPI entry fetch succeeded
- editor mutation succeeded
- viewer mutation was rejected with `AUTH_FORBIDDEN`
- logout succeeded
- `/api/me` after logout returned `AUTH_UNAUTHENTICATED`

Stale-write follow-up:

- a corrected two-session smoke using two independent editor sessions returned `CONFLICT_STALE_WRITE` as expected
- an earlier facilitator mistake using mismatched session and CSRF state produced `AUTH_CSRF_INVALID`; this was a rehearsal setup error, not a product defect

Final smoke interpretation:

- stale-write handling: passed
- session/CSRF enforcement: passed
- conservative mutation flow: passed

Browser walkthrough status:

- browser-based rehearsal steps are prepared in this document
- real browser walkthrough by pilot testers is still pending

Operational tester feedback status:

- no external pilot-tester feedback has been captured yet in this preparation pass

Additional role smoke:

- manager mutation succeeded
- admin mutation succeeded
- locked entry rejection returned `CONFLICT_ENTRY_LOCKED`
- invalid rule rejection returned `CONFLICT_VALUE_RULE_VIOLATION`

## 14. Windows SQLite Observation

Observation status:

- transient Windows SQLite WAL / disk I/O issue remains documented as an operational observation
- it did not block the current rehearsal preparation pass

Tracking notes:

- record whether the issue reproduces during actual pilot rehearsal
- if it reappears, record:
  - exact command
  - whether rerun passed
  - whether watchers, antivirus, sync folders, or another process may have held the file

Current mitigation guidance:

- avoid synced folders where possible
- ensure no process is holding the SQLite file
- rerun seed after closing watchers if needed

## 15. Pilot Go / No-Go Summary

Current recommendation for actual controlled pilot rehearsal:

- **Go for controlled pilot rehearsal**

Conditions:

- keep scope limited to the current conservative KPI workflow
- capture screenshots and structured feedback during rehearsal
- log any wording, audit-readability, or stale-write confusion immediately
- do not expand feature scope during rehearsal

## 16. Recommended Next Phase

Recommended next phase after the rehearsal:

- **Pilot Feedback Triage and Scope Decision**

Suggested decision outcomes after rehearsal:

- proceed to a limited internal pilot with the current scope
- refine wording and audit presentation only
- or pause feature expansion if S1/S2 pilot issues are found
