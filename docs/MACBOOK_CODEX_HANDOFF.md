# MacBook Codex Handoff

**Project**: `healthcare-kpi-hub`
**Current repo checkpoint**: `461fe11 docs: add MacBook Codex handoff`
**Pilot execution baseline**: `792dd3d docs: capture hospital role and scope model`
**Date**: `2026-05-29`
**Purpose**: practical handoff for continuing this repo on a MacBook with Codex

## 1. What Was Done Today

The repository moved through these documentation checkpoints today:

1. `82fc153 docs: harden controlled pilot rehearsal package`
2. `9da19ff docs: align pilot rehearsal logistics`
3. `c312ea6 docs: capture KPI dashboard visualization requirements`
4. `0705d7b docs: finalize controlled pilot rehearsal logistics`
5. `792dd3d docs: capture hospital role and scope model`
6. `461fe11 docs: add MacBook Codex handoff`

What these commits achieved:

- hardened the controlled pilot rehearsal package
- added defect ID and evidence capture conventions
- added ownership fields and tester logistics checklists
- captured dashboard visualization as a core future capability, but gated after pilot feedback triage
- captured hospital role and authorization scope design as a future capability, but gated after pilot feedback triage
- added a MacBook-specific handoff checkpoint for continuing the owner-led rehearsal on this machine

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

- `Ready for owner-led controlled rehearsal execution`
- not ready for broad rollout
- dashboard visualization is captured as a gated future capability
- hospital role and scope redesign is captured as a gated future capability
- current rehearsal type is `owner-led controlled rehearsal / internal dry run`
- current tester mapping is `T-01 = project owner / facilitator` across `viewer`, `editor`, `manager`, and `admin`
- this rehearsal validates workflow readiness before inviting additional operational testers
- this is not external operational user pilot feedback

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

These items are now confirmed for the current owner-led execution pass:

- rehearsal date and time confirmed as `2026-05-29`, start `20:31`, expected duration `90 minutes`, timezone `Asia/Bangkok (+07)`
- seed or test credentials distributed securely via out-of-band handling

Already confirmed for the owner-led internal dry run:

- tester list confirmed as `T-01`
- tester-role mapping confirmed as `T-01 -> viewer, editor, manager, admin`
- facilitator confirmed as project owner / facilitator
- evidence capture owner confirmed for the initial owner-led pass

Credentials are handled out-of-band and are not stored in repository documents.

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

- current commit should include `461fe11` or a later approved checkpoint
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

1. review the owner-led execution results recorded in `docs/PILOT_REHEARSAL_LOG.md`
2. triage the pass in `docs/PILOT_FEEDBACK_TRIAGE.md`
3. keep dashboard, import, assignment, due-date, and role-model work gated until triage is complete

## 10. Starter Prompt For Codex On MacBook

```text
We are continuing healthcare-kpi-hub from checkpoint 461fe11 docs: add MacBook Codex handoff.

The operational KPI workflow is already implemented through auth, navigation, worklist, KPI page detail, KPI entry detail, conservative KPI mutation, stale-write protection, and service-layer semantic audit.

Current status: Ready for owner-led controlled rehearsal execution. This pass is an owner-led controlled rehearsal / internal dry run with T-01 as the project owner / facilitator across viewer, editor, manager, and admin. The owner-led dry run executed on 2026-05-29 with 14 pass / 0 fail / 0 blocked / 0 defects. Broad rollout is not approved. Dashboard visualization and hospital role-and-scope redesign are captured as gated future capabilities only.

Please read docs/CURRENT_HANDOFF.md, docs/MACBOOK_CODEX_HANDOFF.md, docs/PILOT_READINESS_CHECKLIST.md, docs/PILOT_REHEARSAL_LOG.md, docs/PILOT_FEEDBACK_TRIAGE.md, docs/PILOT_DEFECT_TEMPLATE.md, and docs/PILOT_TESTER_BRIEF.md first.

Do not start import, dashboard implementation, assignment or due-date workflow, unlock workflow, or advanced permission redesign before controlled rehearsal results and feedback triage exist.
```
