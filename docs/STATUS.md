# Project Status

**Checkpoint**: `792dd3d docs: capture hospital role and scope model`
**Previous baseline**: `0705d7b docs: finalize controlled pilot rehearsal logistics`
**Earlier baseline**: `c312ea6 docs: capture KPI dashboard visualization requirements`
**Date**: `2026-05-29`

## Verified

- foundation scaffold is runnable
- auth and session baseline is working
- RBAC resolves from SQLite
- live MariaDB authentication is verified
- `/api/me`, `/api/navigation`, and `/api/worklist` are available
- hierarchy-aware KPI page read flow is implemented
- KPI entry detail read flow is implemented
- conservative KPI mutation is implemented
- optimistic concurrency and stale-write protection are implemented
- service-layer semantic audit is implemented

## Deferred

- import workflow
- KPI template import design and implementation
- operational KPI value import design and implementation
- dashboard or aggregation
- dashboard visualization implementation
- hospital role and authorization scope redesign implementation
- assignment editing
- due date editing
- advanced permission redesign
- async jobs and realtime

## Recommended Next Phase

- use the controlled pilot rehearsal package before any large feature expansion
- read [CURRENT_HANDOFF.md](D:/home/github/healthcare-kpi-hub/docs/CURRENT_HANDOFF.md)
- read [MACBOOK_CODEX_HANDOFF.md](D:/home/github/healthcare-kpi-hub/docs/MACBOOK_CODEX_HANDOFF.md) when continuing on another machine
- review [PILOT_READINESS_CHECKLIST.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_READINESS_CHECKLIST.md)
- execute with [PILOT_REHEARSAL_LOG.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_REHEARSAL_LOG.md)
- triage with [PILOT_FEEDBACK_TRIAGE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_FEEDBACK_TRIAGE.md)
- capture future dashboard requirements in [DASHBOARD_VISUALIZATION_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_VISUALIZATION_REQUIREMENTS.md)
- capture future hospital role and scope requirements in [ROLE_AND_SCOPE_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/ROLE_AND_SCOPE_REQUIREMENTS.md)

Current controlled pilot package status:

- `Ready for owner-led controlled rehearsal preparation`
- move to `Ready for controlled pilot rehearsal execution pending tester scheduling` only after tester list, tester-role mapping, rehearsal date/time, and secure credential distribution are confirmed
- current logistics check still shows pending tester confirmation and scheduling

Dashboard requirement note:

- `healthcare-kpi-hub` is both an operational KPI management system and a future KPI dashboard and visualization platform
- dashboard implementation is deferred until controlled pilot rehearsal results and feedback triage are recorded

Hospital role-model requirement note:

- organizational position must remain separate from system role and authorization scope
- future authorization should evolve toward `role + scope + permission`
- current controlled rehearsal still uses only `viewer`, `editor`, `manager`, and `admin`
