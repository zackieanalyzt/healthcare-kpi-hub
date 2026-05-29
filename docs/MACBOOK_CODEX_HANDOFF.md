# MacBook Codex Handoff

**Project**: `healthcare-kpi-hub`
**Current repo checkpoint**: `792dd3d docs: capture hospital role and scope model`
**Pilot execution baseline**: `0705d7b docs: finalize controlled pilot rehearsal logistics`
**Date**: `2026-05-29`
**Purpose**: practical handoff for continuing this repo on a MacBook with Codex

## 1. What Was Done Today

The repository moved through these documentation checkpoints today:

1. `82fc153 docs: harden controlled pilot rehearsal package`
2. `9da19ff docs: align pilot rehearsal logistics`
3. `c312ea6 docs: capture KPI dashboard visualization requirements`
4. `0705d7b docs: finalize controlled pilot rehearsal logistics`
5. `792dd3d docs: capture hospital role and scope model`

What these commits achieved:

- hardened the controlled pilot rehearsal package
- added defect ID and evidence capture conventions
- added ownership fields and tester logistics checklists
- captured dashboard visualization as a core future capability, but gated after pilot feedback triage
- captured hospital role and authorization scope design as a future capability, but gated after pilot feedback triage

## 2. Current Product State

`healthcare-kpi-hub` currently behaves as an operational KPI management system first.

Implemented baseline:

- auth, session persistence, logout, and revoke
- RBAC from local SQLite
- live MariaDB authentication verification
- `/api/me`
- `/api/navigation`
- `/api/worklist`
- `GET /api/kpi-pages/:pageId`
- `GET /api/kpi-entries/:entryId`
- `PATCH /api/kpi-entries/:entryId`
- conservative KPI mutation
- optimistic concurrency with `updated_at`
- stale-write protection
- service-layer semantic audit
- Thai-ready message mapping

Current status:

- `Ready for owner-led controlled rehearsal preparation`
- not ready for broad rollout
- dashboard visualization is captured as a gated future capability
- hospital role and scope redesign is captured as a gated future capability

## 3. What Has Not Been Implemented Yet

Do not start these before controlled rehearsal results and feedback triage exist:

- import workflow
- KPI template creation or import
- operational KPI value import
- dashboard implementation
- aggregation service
- assignment editing
- due date editing
- target value editing
- `extra_json` editing
- unlock workflow
- node-scoped authorization
- advanced permission redesign
- realtime, notification, or async jobs

## 4. Current Pilot Scope

The controlled rehearsal still uses only the current pilot roles:

- `viewer`
- `editor`
- `manager`
- `admin`

Important:

- this is still the active pilot scope
- `executive`, `department_manager`, `unit_manager`, `staff_editor`, and `system_admin` are future design concepts only
- dashboard requests during rehearsal must be logged as `S4 observation` or future request
- role-model requests during rehearsal must be logged as `S4 observation` or future role-model requirement unless current authorization is unsafe

## 5. Remaining Rehearsal Logistics To Confirm

These were still pending in the last readiness pass:

- tester list confirmed
- tester-role mapping confirmed
- rehearsal date and time confirmed
- seed or test credentials distributed securely

Do not invent these values in docs.

If they become known outside repo, update the rehearsal docs with the confirmed labels and statuses.

## 6. Files Codex Should Read First On MacBook

Read in this order:

1. [CURRENT_HANDOFF.md](D:/home/github/healthcare-kpi-hub/docs/CURRENT_HANDOFF.md)
2. [MACBOOK_CODEX_HANDOFF.md](D:/home/github/healthcare-kpi-hub/docs/MACBOOK_CODEX_HANDOFF.md)
3. [PILOT_READINESS_CHECKLIST.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_READINESS_CHECKLIST.md)
4. [PILOT_REHEARSAL_LOG.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_REHEARSAL_LOG.md)
5. [PILOT_FEEDBACK_TRIAGE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_FEEDBACK_TRIAGE.md)
6. [PILOT_DEFECT_TEMPLATE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_DEFECT_TEMPLATE.md)
7. [PILOT_TESTER_BRIEF.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_TESTER_BRIEF.md)
8. [DASHBOARD_VISUALIZATION_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_VISUALIZATION_REQUIREMENTS.md)
9. [ROLE_AND_SCOPE_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/ROLE_AND_SCOPE_REQUIREMENTS.md)

## 7. Suggested MacBook Setup Flow

After opening the repo on the MacBook, run:

```bash
git checkout main
git pull
git log --oneline -5
git status --short
bun install
bun run typecheck
bun run lint
bun run test
bun run --cwd apps/api typecheck
bun run --cwd apps/api test
bun run --cwd apps/web typecheck
bun run --cwd apps/web test
```

Expected result:

- current commit should include `792dd3d` or a later approved checkpoint
- working tree should be clean
- verification should pass

## 8. Environment Notes For MacBook

- use Bun as the package runner
- use local SQLite for the application database
- do not commit credentials
- do not place passwords, tokens, cookies, or patient data in docs or screenshots
- if evidence contains sensitive operational data, keep it outside git and record only the reference path in the rehearsal log

If a fresh local DB is needed:

- recreate the ignored local SQLite DB
- rerun migrate
- rerun seed

## 9. Exact Next Action

The next sensible step is still:

1. confirm the remaining rehearsal logistics
2. brief testers with `docs/PILOT_TESTER_BRIEF.md`
3. execute scenarios `R-01` through `R-14`
4. record evidence and defects
5. complete post-rehearsal triage before opening any new feature phase

## 10. Starter Prompt For Codex On MacBook

```text
We are continuing healthcare-kpi-hub from checkpoint 792dd3d docs: capture hospital role and scope model.

The operational KPI workflow is already implemented through auth, navigation, worklist, KPI page detail, KPI entry detail, conservative KPI mutation, stale-write protection, and service-layer semantic audit.

Current status: Ready for owner-led controlled rehearsal preparation. Broad rollout is not approved. Dashboard visualization and hospital role-and-scope redesign are captured as gated future capabilities only.

Please read docs/CURRENT_HANDOFF.md, docs/MACBOOK_CODEX_HANDOFF.md, docs/PILOT_READINESS_CHECKLIST.md, docs/PILOT_REHEARSAL_LOG.md, docs/PILOT_FEEDBACK_TRIAGE.md, docs/PILOT_DEFECT_TEMPLATE.md, and docs/PILOT_TESTER_BRIEF.md first.

Do not start import, dashboard implementation, assignment or due-date workflow, unlock workflow, or advanced permission redesign before controlled rehearsal results and feedback triage exist.
```
