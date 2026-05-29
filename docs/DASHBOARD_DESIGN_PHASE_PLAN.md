# Dashboard Design Phase Plan

**Status**: `design phase only`
**Authorized by**: `17968ea docs: complete owner-led rehearsal triage decision`
**Date**: `2026-05-29`

## 1. Purpose

This document starts the `Dashboard and KPI Visualization Design Phase`.

It defines what must be designed before any dashboard implementation begins.

This phase does not implement:

- dashboard UI
- chart library integration
- dashboard API routes
- aggregation services
- schema or migration changes
- seed changes
- frontend route or default landing behavior changes
- RBAC changes
- hospital role and scope model implementation

## 2. Design Inputs

Primary source documents:

1. [PILOT_FEEDBACK_TRIAGE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_FEEDBACK_TRIAGE.md)
2. [DASHBOARD_VISUALIZATION_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_VISUALIZATION_REQUIREMENTS.md)
3. [ROLE_AND_SCOPE_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/ROLE_AND_SCOPE_REQUIREMENTS.md)
4. [NEXT_PHASE_PLAN.md](D:/home/github/healthcare-kpi-hub/docs/NEXT_PHASE_PLAN.md)
5. [CURRENT_HANDOFF.md](D:/home/github/healthcare-kpi-hub/docs/CURRENT_HANDOFF.md)
6. [STATUS.md](D:/home/github/healthcare-kpi-hub/docs/STATUS.md)
7. [PILOT_REHEARSAL_LOG.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_REHEARSAL_LOG.md)
8. [KPI_MEASUREMENT_MODEL_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/KPI_MEASUREMENT_MODEL_REQUIREMENTS.md)
9. [KPI_MEASUREMENT_MODEL_DECISIONS.md](D:/home/github/healthcare-kpi-hub/docs/KPI_MEASUREMENT_MODEL_DECISIONS.md)

Key feedback captured from owner-led rehearsal and product review:

- `FB-001`: role-specific UI differentiation is unclear
- `FB-002`: organization-first dashboard landing page with hierarchical drill-down is required in the future

## 3. Primary Goal

Design the future dashboard capability around this target flow:

`Login -> Organization Dashboard Landing Page -> Department / Workgroup -> Unit / Team -> Individual KPI detail`

The dashboard must support executive or organization-first overview while preserving future role-aware landing behavior.

## 4. Design Principles

### 4.1 Overview First

Future landing behavior should begin with organizational context before dropping into lower hierarchy levels.

### 4.2 Workflow Safety First

Dashboard must not bypass:

- workflow status
- validation rules
- stale-write protection
- lock behavior
- audit behavior
- authorization constraints

### 4.3 No Hardcode

This design phase must explicitly avoid hardcoded assumptions.

Do not design around:

- hardcoded usernames
- hardcoded workgroup or department names
- hardcoded page lists
- hardcoded dashboard cards per role
- hardcoded chart types per route
- hardcoded aggregation formulas per one-off KPI

Instead, the future dashboard must be driven by:

- hierarchy metadata
- KPI metadata
- reporting period context
- workflow status rules
- role + scope + permission rules
- read-model or aggregation rules declared explicitly

### 4.4 Explainable Lineage

Every dashboard number, chart, card, and drill-down must be traceable back to source operational records.

## 5. Design Deliverables

This phase is complete only when these design outputs exist:

- [DASHBOARD_UX_FLOW.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_UX_FLOW.md)
- [DASHBOARD_READ_MODEL_DESIGN.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_READ_MODEL_DESIGN.md)
- [DASHBOARD_API_CONTRACT_DRAFT.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_API_CONTRACT_DRAFT.md)
- [KPI_MEASUREMENT_MODEL_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/KPI_MEASUREMENT_MODEL_REQUIREMENTS.md)
- [KPI_MEASUREMENT_MODEL_DECISIONS.md](D:/home/github/healthcare-kpi-hub/docs/KPI_MEASUREMENT_MODEL_DECISIONS.md)
- [DASHBOARD_IMPLEMENTATION_PLANNING_GATE.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_IMPLEMENTATION_PLANNING_GATE.md)

## 6. Scope Of This Design Phase

This phase must answer:

- which personas and future roles need which dashboard landing behavior
- what each hierarchy level shows
- what the read model must derive from
- which statuses count for workload, risk, and achievement
- what KPI-to-chart mapping rules should govern visualization choice
- what API contract shape is likely needed
- how KPI measurement semantics should drive chart choice, target logic, validation direction, and aggregation rules
- which KPI metadata must be first-pass mandatory versus later
- how `target_rule` and optional `threshold_rules` split achievement from risk display
- how permission and scope constraints affect visibility and drill-down
- how UX should improve role differentiation without implementation yet

## 7. Explicit Non-Goals

This phase must not:

- build dashboard pages
- install chart libraries
- add backend routes
- write aggregation SQL
- add new API endpoints
- change default landing page now
- redesign current pilot RBAC now
- add future hospital roles in code now

## 8. Acceptance Criteria

The design phase is acceptable when the docs answer:

- what dashboard content belongs at organization, department, unit, and individual levels
- how dashboard data should derive from current entities
- how KPI measurement semantics and target rules shape dashboard meaning
- which aggregation and status-inclusion questions remain open
- which chart types fit which KPI semantics
- what the draft API contract should expose
- how scope and permission boundaries prevent data leakage
- how UX should evolve from current KPI-first navigation to future dashboard-first flow
- how implementation stays gated until a new approval decision

## 9. Next Step After Design Phase

After these design docs are reviewed, the next step must be a separate scope approval.

No implementation may begin until design review explicitly approves:

- implementation scope
- read-model strategy
- permission strategy
- API strategy
- dashboard UI strategy
