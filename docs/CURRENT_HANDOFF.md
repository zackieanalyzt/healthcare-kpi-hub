# Current Handoff

**Project**: `healthcare-kpi-hub`
**Current checkpoint**: `f0190c1 feat: add Phase 1A organization dashboard skeleton`
**Previous baseline**: `792dd3d docs: capture hospital role and scope model`
**Earlier baseline**: `0705d7b docs: finalize controlled pilot rehearsal logistics`
**Date**: `2026-05-30`

## 1. Current Readiness Status

- `Ready for owner-led controlled rehearsal execution`
- not ready for broad rollout
- feedback must come before feature expansion
- dashboard visualization requirement is captured as a gated future capability; narrow Phase 1A backend work is in progress
- hospital role and scope model is captured as a gated future capability
- current rehearsal type is `owner-led controlled rehearsal / internal dry run`
- current tester mapping is `T-01 = project owner / facilitator` across `viewer`, `editor`, `manager`, and `admin`
- this rehearsal validates workflow readiness before inviting additional operational testers
- this is not external operational user pilot feedback
- rehearsal date is `2026-05-29` (operational) and `2026-05-30` (dashboard Phase 1A)
- seed/test credentials are handled securely out-of-band and are not stored in repository documents
- owner-led dry run results: `14 pass / 0 fail / 0 blocked / 0 defects (operational)`, `5 pass / 0 fail / 0 blocked / 0 defects (dashboard Phase 1A)`

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
- [DASHBOARD_DESIGN_PHASE_PLAN.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_DESIGN_PHASE_PLAN.md)
- [DASHBOARD_UX_FLOW.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_UX_FLOW.md)
- [DASHBOARD_READ_MODEL_DESIGN.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_READ_MODEL_DESIGN.md)
- [DASHBOARD_API_CONTRACT_DRAFT.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_API_CONTRACT_DRAFT.md)
- [DASHBOARD_IMPLEMENTATION_PLANNING_GATE.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_IMPLEMENTATION_PLANNING_GATE.md)
- [DASHBOARD_OWNER_DECISIONS.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_OWNER_DECISIONS.md)
- [DASHBOARD_OWNER_DECISION_ACCEPTANCE.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_OWNER_DECISION_ACCEPTANCE.md)
- [DASHBOARD_PHASE_1A_IMPLEMENTATION_PLAN.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_PHASE_1A_IMPLEMENTATION_PLAN.md)
- [DASHBOARD_IMPLEMENTATION_PLANNING.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_IMPLEMENTATION_PLANNING.md)
- [DASHBOARD_SCHEMA_PLANNING.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_SCHEMA_PLANNING.md)
- [KPI_MEASUREMENT_MODEL_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/KPI_MEASUREMENT_MODEL_REQUIREMENTS.md)
- [KPI_MEASUREMENT_MODEL_DECISIONS.md](D:/home/github/healthcare-kpi-hub/docs/KPI_MEASUREMENT_MODEL_DECISIONS.md)
- [ROLE_AND_SCOPE_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/ROLE_AND_SCOPE_REQUIREMENTS.md)
- [DASHBOARD_PILOT_REHEARSAL_CHECKLIST.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_PILOT_REHEARSAL_CHECKLIST.md)
- [DASHBOARD_PILOT_REHEARSAL_LOG.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_PILOT_REHEARSAL_LOG.md)
- [DASHBOARD_PHASE_1B_IMPLEMENTATION_PLAN.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_PHASE_1B_IMPLEMENTATION_PLAN.md)
- [DASHBOARD_PHASE_1A_TECHNICAL_AUDIT.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_PHASE_1A_TECHNICAL_AUDIT.md)
- [DASHBOARD_PHASE_1B_A_PLAN.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_PHASE_1B_A_PLAN.md)

## 4. What Must Not Be Expanded Yet

Do not expand into these areas before pilot feedback triage:

- import workflow
- KPI template creation or import
- operational KPI value import
- broad dashboard, drill-down, visualization, or advanced aggregation
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
- future dashboard visualization is a core product capability, but broad implementation remains gated beyond the active narrow Phase 1A backend scope
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
3. keep scope guard active: Phase 1A allows only metadata foundation, organization summary backend, one read-only API, and focused backend tests
4. keep role-model feedback and dashboard landing feedback as design inputs unless a future run exposes a real workflow safety defect
5. use the dashboard design docs as the current working set for personas, UX flow, read-model design, and API contract draft; keep all design metadata-driven and avoid hardcoding
6. use the KPI measurement model requirement as a prerequisite for dashboard calculation, target-rule design, visualization choice, and future import design
7. use the KPI measurement decision baseline to keep first-pass implementation scope conservative and metadata-driven, with no hardcoded KPI-specific logic
8. keep `target_rule` separate from optional `threshold_rules`, so achievement and risk display do not collapse into one implicit rule
9. use [DASHBOARD_IMPLEMENTATION_PLANNING_GATE.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_IMPLEMENTATION_PLANNING_GATE.md) before opening schema, API, or UI implementation planning
10. treat the first-pass KPI measurement metadata baseline as approved for implementation planning only
11. use [DASHBOARD_IMPLEMENTATION_PLANNING.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_IMPLEMENTATION_PLANNING.md) as the planning baseline for schema, read-model, API, threshold, permission, and test strategy decisions
12. use [DASHBOARD_SCHEMA_PLANNING.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_SCHEMA_PLANNING.md) as the schema/metadata placement baseline before any migration approval is requested
13. use [DASHBOARD_READ_MODEL_DESIGN.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_READ_MODEL_DESIGN.md) as the current planning baseline for source inputs, read-model levels, achievement and risk derivation, status inclusion, lineage, data quality warnings, and first-pass read-model strategy recommendation
14. keep dashboard implementation limited to the approved Phase 1A backend slice; no UI, drill-down, cache, or advanced aggregation implementation is authorized
15. use [DASHBOARD_IMPLEMENTATION_PLANNING_GATE.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_IMPLEMENTATION_PLANNING_GATE.md) as the current gate review baseline for implementation readiness, prerequisites, owner decisions, and narrow first-phase recommendation
16. broad dashboard implementation remains out of scope even though the narrow Phase 1A backend slice is now open
17. keep all Phase 1A code work aligned with the accepted status inclusion, overdue, scope-resolution, and enum baselines
18. use [DASHBOARD_OWNER_DECISIONS.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_OWNER_DECISIONS.md) as the decision-closure baseline for unresolved owner choices before Phase 1A
19. do not open implementation until the owner accepts the required decision set for status inclusion, overdue, scope hierarchy, enum naming, unconfigured KPI handling, minimum warning set, and minimum lineage set
20. use [DASHBOARD_OWNER_DECISION_ACCEPTANCE.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_OWNER_DECISION_ACCEPTANCE.md) as the accepted baseline that now governs active Phase 1A implementation work
21. current dashboard state is in active narrow-scope Phase 1A backend implementation, not broad dashboard implementation
22. keep the active Phase 1A boundary narrow: metadata foundation plus organization summary backend only
23. use [DASHBOARD_PHASE_1A_IMPLEMENTATION_PLAN.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_PHASE_1A_IMPLEMENTATION_PLAN.md) as the kickoff plan for the narrow implementation opening
24. Phase 1A code work is now open only for the approved narrow backend slice
25. Phase 1A implementation has now started in the narrow approved backend scope only:
    metadata foundation plus organization summary backend
26. keep Phase 1A implementation constrained to backend schema, validation, organization summary read model, one read-only API, and focused backend tests only
27. do not expand current code work into drill-down, chart library, materialized cache, import, RBAC, advanced aggregation, or KPI mutation behavior changes
28. Phase 1A is complete: metadata foundation, organization summary backend, stable API contract, organization dashboard UI skeleton, API+Web smoke, and owner pilot rehearsal all passed with 0 defects
29. Phase 1A.7 test hardening revealed and fixed a production bug: milestone achievement derivation silently returned NOT_CONFIGURED for all values due to missing MILESTONE_AT_LEAST/MILESTONE_EXACT cases in compareNumeric; fixed in service.ts
30. Phase 1B Option A approved; Phase 1B-A planning is open docs-only; see [DASHBOARD_PHASE_1B_A_PLAN.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_PHASE_1B_A_PLAN.md); owner must confirm parent scope check strategy before Phase 1B-A implementation begins

## 7. Phase 1A.3 Manual Browser Smoke Checklist

Use this checklist for owner or developer review of `/dashboard`:

1. login/open app succeeds
2. `/dashboard` opens inside the existing app shell
3. dashboard calls the organization summary API only
4. loading state is visible before data renders
5. summary cards show total, completed, pending, overdue, at-risk, and achievement values
6. empty state is readable when no operational KPI is included
7. error state is readable when the API is unavailable or returns an error
8. warnings, lineage, and meta sections are readable without overwhelming the page
9. no drill-down controls are visible
10. no chart placeholder, chart library dependency, or chart container is visible

## 8. Copy/Paste Starter Text For Next Chat

```text
We are continuing healthcare-kpi-hub from checkpoint f8d1a1b fix: harden dashboard achievement tests before Phase 1B.

The system currently has foundation/auth/RBAC, hierarchy-aware KPI page read model, KPI entry detail, conservative KPI mutation, optimistic concurrency with updated_at, stale-write protection, service-layer semantic audit, Thai-ready message mapping, a complete Phase 1A organization dashboard (backend + UI skeleton + owner pilot rehearsal passed), and Phase 1A.7 test hardening (milestone achievement bug fixed).

Current status: Phase 1B Option A approved. Phase 1B-A (department/workgroup backend slice) planning is complete docs-only. Owner must confirm the parent scope check strategy (direct parent only vs recursive ancestor) before Phase 1B-A implementation begins. No code changes are open until owner confirms.

Phase 1B-A scope: shared-types DashboardScopeType extension, DASHBOARD_SCOPES.DEPARTMENT config, findDepartmentScopeNode repository, listScopedEntryRecords refactor, getDepartmentDashboardSummary service, router dispatch extension, service tests, integration tests. No UI, no chart, no unit/individual scope, no RBAC, no import, no KPI mutation.

Hospital authorization must eventually separate organizational position, system role, and hierarchy scope, but the current system still uses only viewer/editor/manager/admin. See docs/ROLE_AND_SCOPE_REQUIREMENTS.md.

If continuing on another machine such as a MacBook, read docs/MACBOOK_CODEX_HANDOFF.md as well.

Please read docs/DASHBOARD_PHASE_1B_A_PLAN.md, docs/DASHBOARD_PHASE_1A_TECHNICAL_AUDIT.md, docs/DASHBOARD_PHASE_1B_IMPLEMENTATION_PLAN.md, docs/DASHBOARD_API_CONTRACT_DRAFT.md, docs/DASHBOARD_OWNER_DECISION_ACCEPTANCE.md, docs/CURRENT_HANDOFF.md, and docs/STATUS.md first, then await owner confirmation of the parent scope check strategy before implementing Phase 1B-A code.
```
