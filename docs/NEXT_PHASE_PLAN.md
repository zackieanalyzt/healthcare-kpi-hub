# Next Phase Plan

**Starting Point**: `0705d7b docs: finalize controlled pilot rehearsal logistics`
**Date**: 2026-05-29

## Goal

Preserve the controlled pilot rehearsal gate and capture the next design candidates without starting implementation prematurely.

## Recommended Scope

- complete controlled pilot rehearsal
- complete pilot feedback triage
- make an explicit scope decision before the next feature phase
- keep future dashboard capability documented without implementing it yet

Suggested future design candidates after triage:

- Assignment and Due-Date Workflow Design
- KPI Template Import Design
- Operational KPI Value Import Design
- Dashboard and KPI Visualization Design Phase
- Hospital Role and Authorization Scope Design Phase

Reference documents for deferred design candidates:

- [DASHBOARD_VISUALIZATION_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_VISUALIZATION_REQUIREMENTS.md)
- [ROLE_AND_SCOPE_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/ROLE_AND_SCOPE_REQUIREMENTS.md)

## Explicit Non-Goals

- dashboard implementation
- chart library integration
- dashboard API implementation
- dashboard migration or schema change
- import workflow implementation
- assignment or due-date workflow implementation
- advanced permission redesign
- async jobs or realtime

## Entry Criteria

- controlled pilot rehearsal results are recorded
- pilot feedback triage is recorded
- scope decision is made explicitly
- baseline verification remains green

## Exit Criteria

- next design phase is selected intentionally
- dashboard remains gated until post-triage scope approval
- role and scope redesign remains gated until post-triage scope approval
- docs are updated with the chosen next phase and rationale
