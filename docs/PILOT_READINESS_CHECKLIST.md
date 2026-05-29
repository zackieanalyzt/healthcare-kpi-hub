# Pilot Readiness Checklist

**Checkpoint commit**: `edeba62e8a4f5b2d6a2a55b4a9f2b3c7d0f0d9f0`
**Checkpoint message**: `test: harden KPI mutation UX and audit history`
**Date**: `2026-05-29`
**Status**: `candidate for controlled pilot preparation`

## 1. Current Checkpoint Summary

The current application baseline supports the following operational KPI flow:

- login and session-based authentication
- SQLite-backed local roles and permissions
- navigation and worklist read flow
- hierarchy-aware KPI page detail
- KPI entry read-only detail
- conservative KPI entry mutation
- `updated_at` optimistic concurrency
- service-layer semantic audit events
- user-facing mutation error messages
- Thai-ready mutation message mapping
- readable audit history cards

This checklist is for manual QA and controlled pilot-readiness review only. It does not expand product scope.

## 2. Environment Assumptions

- Repo root: `D:\home\github\healthcare-kpi-hub`
- Runtime: `Bun`
- Backend environment for manual smoke:
  - `NODE_ENV=development`
  - `AUTH_PROVIDER=dev`
  - `API_PORT=3015`
- Local SQLite database path:
  - `apps/api/data/app.db` via current app defaults
- Seed data assumptions:
  - deterministic seeded users and KPI content are present
- Browser assumptions for manual UI testing:
  - modern Chromium-based browser or Firefox
- OS observations:
  - Windows remains the main local verification environment for this pass

## 3. Test User / Role Matrix

| Role | Seeded username | Primary purpose | Mutation expectation |
|---|---|---|---|
| `viewer` | `viewer.user` | read navigation, KPI page, KPI entry | cannot mutate |
| `editor` | `editor.user` | standard KPI value and status update flow | can mutate conservative fields |
| `manager` | `manager.user` | same `kpi.update` behavior as editor in current release | can mutate conservative fields |
| `admin` | `admin.user` | full current permission model baseline | can mutate conservative fields |

Development auth note:

- local development uses the seeded dev-auth password configured by the repository defaults
- do not use this mode for production or broader pilot deployment

## 4. Manual QA Scenarios

### 4.1 Authentication / Session

Steps:

1. Login with a valid seeded user.
2. Verify a session cookie is set.
3. Open `/api/me` or confirm current-user UI context.
4. Logout.
5. Reopen `/api/me`.

Expected:

- login succeeds
- session is created and persisted as a hash server-side
- logout revokes the current session
- `/api/me` returns unauthorized after logout

Execution status:

- executed via local API smoke
- result: passed

### 4.2 Role / Permission Behavior

Steps:

1. Login as `viewer.user`.
2. Open KPI read endpoints.
3. Attempt KPI mutation as viewer.
4. Login as `editor.user`, `manager.user`, and `admin.user`.
5. Attempt conservative KPI mutation for each permitted role.

Expected:

- viewer can read but cannot mutate
- editor can mutate only approved conservative fields
- manager currently shares `kpi.update` behavior with editor
- admin can mutate under the same current permission model
- forbidden users receive a clear operational message

Execution status:

- partially executed via local API smoke
- result:
  - viewer read: passed
  - viewer mutate rejection: passed
  - editor mutate: passed
  - manager mutate: passed
  - admin mutate: passed

### 4.3 Navigation / KPI Page Flow

Steps:

1. Login.
2. Open navigation.
3. Open a KPI page.
4. Review hierarchy context.
5. Review parent/current/child context.
6. Verify assigned KPI items.
7. Follow page-to-entry deep-link.

Expected:

- hierarchy-aware page displays correctly
- navigation grouping and ownership hierarchy are both understandable
- page-to-entry deep-link works

Execution status:

- partially executed via local API smoke
- result:
  - KPI page fetch: passed
  - hierarchy level observed: `unit`
  - UI walkthrough remains a manual browser follow-up

### 4.4 KPI Entry Read-Only View

Steps:

1. Open a KPI entry detail.
2. Verify definition context.
3. Verify reporting period context.
4. Verify page / workgroup / section context.
5. Verify hierarchy breadcrumb context.
6. Verify value display.
7. Verify audit history display.

Expected:

- entry detail is understandable to an operational user
- no raw JSON is shown as the primary audit display
- empty/no-history states are understandable

Execution status:

- partially executed via local API smoke and code review of current UI
- result:
  - entry detail response shape: passed
  - human-readable audit presentation: implemented
  - browser-side visual review still recommended

### 4.5 Conservative KPI Mutation

Editable fields in current release:

- `status`
- `value.actual_value`
- `value.progress_value`
- `value.note`

Steps:

1. Open an editable KPI entry.
2. Update one or more approved fields.
3. Save.
4. Verify refreshed UI/data.
5. Verify audit history includes the change.
6. Verify `updated_at` changes.

Expected:

- save succeeds for a valid editable entry
- refreshed response updates the screen
- audit history includes mutation summary
- `updated_at` changes after save

Execution status:

- executed via local API smoke
- result: passed

### 4.6 Deferred Field Rejection

Rejected fields:

- `assigned_to`
- `due_at`
- `value.target_value`
- `value.extra_json`
- unknown top-level fields
- unknown nested `value` fields

Expected:

- request is rejected
- no mutation is persisted
- no audit event is created

Execution status:

- covered by automated integration tests
- result: passed

### 4.7 Stale Write / Two Browser Test

Manual steps:

1. Open the same KPI entry in Browser A.
2. Open the same KPI entry in Browser B.
3. Save a valid change in Browser A.
4. Without refresh, save a change in Browser B.

Expected:

- Browser B receives a stale-write error
- the message is understandable
- the stale request does not persist data
- no audit event is created for the stale request

Execution status:

- executed via two-session API smoke equivalent
- result: passed with `CONFLICT_STALE_WRITE`

### 4.8 Locked Entry Behavior

Steps:

1. Attempt mutation on a seeded locked entry.

Expected:

- mutation is rejected
- user sees a clear locked-entry message
- no audit event is created

Execution status:

- executed via local API smoke
- result: passed with `CONFLICT_ENTRY_LOCKED`

### 4.9 Closed Reporting Period Behavior

Steps:

1. Temporarily set the reporting period to `closed`.
2. Attempt mutation.

Expected:

- mutation is rejected
- user sees a clear closed-period message
- no audit event is created

Execution status:

- covered by automated integration tests
- result: passed with `CONFLICT_REPORTING_PERIOD_CLOSED`

### 4.10 Invalid Value Behavior

Steps:

1. Submit invalid `progress_value`.
2. Submit a value that violates current preset/value rules.

Expected:

- mutation is rejected
- user-facing validation message is useful
- no audit event is created

Execution status:

- executed in mixed form
- local API smoke:
  - invalid definition rule: passed with `CONFLICT_VALUE_RULE_VIOLATION`
- automated integration:
  - invalid progress: passed with `VALIDATION_FAILED`

### 4.11 Audit History Readability

Review audit cards for:

- value update
- status change
- submit
- return
- lock
- combined status + value update

Expected:

- actor is visible
- timestamp is visible
- changed fields are summarized
- old/new summaries are readable where available
- operational users can understand the event without reading raw payload JSON

Execution status:

- partially executed through API smoke and frontend helper tests
- result: passed for current implementation shape

### 4.12 Thai / English Message Readiness

Expected:

- messages are centralized
- Thai text is understandable
- English default remains clear
- future i18n wiring remains feasible

Execution status:

- executed by code inspection and frontend helper tests
- result: passed for mapping readiness

### 4.13 Windows SQLite Operational Observation

Observation:

- one `db:seed` run on Windows encountered a transient SQLite WAL-related disk I/O error
- immediate rerun succeeded without code changes

Checks to perform during pilot-prep:

1. rerun `bun run db:seed`
2. verify whether the error reproduces
3. check whether local file watchers, antivirus, sync folders, or concurrent SQLite access may be involved

Current conclusion:

- accepted as a transient operational observation
- not currently considered a logic defect blocker

Suggested mitigations:

- avoid running the repo inside synced folders such as OneDrive
- ensure no process is holding the SQLite file during migrate/seed
- rerun seed after closing file watchers if the error appears again
- if local policy allows, consider excluding the dev SQLite path from aggressive antivirus scanning
- if a pristine local demo state is required after manual mutation smoke tests, recreate the ignored local SQLite database and rerun migrate/seed rather than assuming seed scripts will overwrite every value

## 5. Expected Results Summary

| Area | Expected result | Current status |
|---|---|---|
| Authentication | login/logout/session revoke works | passed |
| Roles | viewer blocked from mutation, editor/manager/admin allowed | passed |
| KPI page flow | hierarchy-aware page context visible | passed |
| KPI entry read | context and history understandable | passed with manual UI review still recommended |
| Conservative mutation | approved fields save correctly | passed |
| Deferred fields | rejected without audit write | passed |
| Stale write | clear conflict and no audit write | passed |
| Locked entry | clear rejection and no audit write | passed |
| Closed period | clear rejection and no audit write | passed by automated test |
| Invalid values | rejected with useful feedback | passed |
| Audit readability | operationally readable summaries | passed with continued real-user review recommended |
| Thai-ready mapping | centralized and feasible for future i18n | passed |

## 6. Executed Scenario Evidence

### 6.1 Local API Smoke Results

Executed against:

- `http://127.0.0.1:3015`
- dev auth provider
- seeded development users

Observed results:

- login succeeded for `viewer.user`, `editor.user`, `manager.user`, `admin.user`
- `/api/me` returned `viewer` role for `viewer.user`
- KPI page fetch succeeded for `pag_unit_bi_team`
- KPI entry mutation by viewer was rejected with `AUTH_FORBIDDEN`
- KPI entry mutation by editor succeeded
- stale-write second-session mutation was rejected with `CONFLICT_STALE_WRITE`
- logout succeeded
- `/api/me` after logout returned `AUTH_UNAUTHENTICATED`
- manager mutation succeeded
- admin mutation succeeded
- locked-entry mutation was rejected with `CONFLICT_ENTRY_LOCKED`
- invalid value-rule mutation was rejected with `CONFLICT_VALUE_RULE_VIOLATION`

### 6.2 Automated Regression Results

Commands run:

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

Results:

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
- `git diff --check`: no content errors
- `git status --short`: use to confirm local working tree before commit in future changes

## 7. Evidence Capture Template

Use this for manual pilot validation evidence:

| Field | Value |
|---|---|
| date/time | |
| environment | |
| OS | |
| browser | |
| commit hash | |
| tester | |
| scenario | |
| result | pass / fail / blocked |
| evidence link or screenshot path | |
| notes | |
| defect created | yes / no |

## 8. Known Risks and Mitigations

### Current Known Risks

- frontend edit-mode coverage is helper-level, not full DOM interaction coverage
- audit readability has improved, but operational-user feedback should still be collected during a controlled pilot
- manager and editor still share the same `kpi.update` permission in the current release
- closed-period behavior is strongly covered by integration tests, but not yet exercised in a browser-driven manual flow

### Mitigations

- use the current checklist during pilot rehearsal
- capture screenshots for error states and audit cards
- collect wording feedback from Thai-speaking operational users early
- keep pilot scope limited to conservative mutation only

## 9. Pilot Readiness Conclusion

Conclusion:

- the current KPI workflow is suitable for a **controlled internal pilot preparation** phase
- the system is not yet ready for broad rollout, expanded workflow scope, or advanced authorization scenarios
- current readiness is strongest for:
  - role-based read and conservative update flow
  - audit traceability
  - stale-write protection
  - operational error clarity

## 10. Go / No-Go Checklist

| Check | Status |
|---|---|
| authentication and logout verified | go |
| conservative mutation verified | go |
| stale-write protection verified | go |
| audit event generation verified | go |
| audit readability baseline acceptable | go with follow-up feedback |
| deferred fields still rejected | go |
| role behavior verified for current permission model | go |
| Thai-ready mapping prepared | go |
| Windows SQLite transient observation understood enough for pilot prep | go with operational note |
| broader feature expansion required before pilot | no |

Go / no-go recommendation:

- **Go for controlled pilot preparation**
- conditions:
  - keep scope limited to current conservative KPI workflow
  - use this checklist during rehearsal
  - monitor Windows SQLite local dev behavior if repeated

## 11. Recommended Next Phase

Recommended next phase:

- **Controlled Pilot Rehearsal and Feedback Capture**

Suggested follow-up scope:

- run this checklist with real pilot testers
- collect wording feedback on English and Thai-ready messages
- review audit card comprehension with operational users
- decide whether the next functional expansion should be:
  - assignment and due-date workflow design, or
  - import workflow design
