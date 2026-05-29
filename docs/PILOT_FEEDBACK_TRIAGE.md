# Pilot Feedback Triage

**Purpose**: Structured triage for controlled pilot rehearsal feedback and scope decisions
**Baseline checkpoint**: `461fe11 docs: add MacBook Codex handoff`
**Previous baseline**: `792dd3d docs: capture hospital role and scope model`
**Earlier baseline**: `0705d7b docs: finalize controlled pilot rehearsal logistics`
**Current status**: `for post-rehearsal triage only`

## 1. Purpose

This document turns rehearsal results into a clear decision. It exists to prevent premature feature expansion and to ensure that feedback from a small controlled pilot rehearsal is reviewed consistently before the project moves forward.

This document must not be used to justify broad rollout without evidence from rehearsal execution.

Current rehearsal context for the next pass:

- `owner-led controlled rehearsal / internal dry run`
- `T-01 = project owner / facilitator`
- `T-01` covers `viewer`, `editor`, `manager`, and `admin`
- this rehearsal validates workflow readiness before inviting additional operational testers
- this is not external operational user pilot feedback

## 2. Input Documents

Use the following as source inputs:

- [PILOT_READINESS_CHECKLIST.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_READINESS_CHECKLIST.md)
- [PILOT_REHEARSAL_LOG.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_REHEARSAL_LOG.md)
- [PILOT_DEFECT_TEMPLATE.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_DEFECT_TEMPLATE.md)
- [PILOT_TESTER_BRIEF.md](D:/home/github/healthcare-kpi-hub/docs/PILOT_TESTER_BRIEF.md)
- screenshots, notes, and linked evidence from the rehearsal session

## 3. Rehearsal Execution Summary

Complete after rehearsal:

| Field | Value |
|---|---|
| rehearsal date | `2026-05-29` |
| checkpoint under review | `bb5e8c3` with rehearsal evidence recorded against the owner-led dry run package beginning at `461fe11` |
| facilitator | `T-01 = project owner / facilitator` |
| triage owner | `Project owner` |
| decision owner | `Project owner and steering reviewer` |
| total testers | `1` |
| total scenarios planned | 14 |
| total scenarios executed | `14` |
| pass count | `14` |
| fail count | `0` |
| blocked count | `0` |
| not-run count | `0` |
| defect count | `0` |
| recommendation summary | `Open next design phase: Dashboard and KPI Visualization Design Phase (design only, no implementation yet)` |

## 4. Participant / Tester Summary

Keep this lightweight and avoid detailed personal information.

| Tester label | Work context | Role tested | Browser | Notes |
|---|---|---|---|---|
| T-01 | project owner / facilitator | viewer | MacBook desktop browser | owner-led internal dry run |
| T-01 | project owner / facilitator | editor | MacBook desktop browser | owner-led internal dry run |
| T-01 | project owner / facilitator | manager | MacBook desktop browser | owner-led internal dry run |
| T-01 | project owner / facilitator | admin | MacBook desktop browser | owner-led internal dry run |

## 5. Ownership

Fill these fields before triage starts:

| Field | Value |
|---|---|
| Facilitator | Project owner / facilitator |
| Triage owner | Project owner |
| Decision owner | Project owner and steering reviewer |
| Evidence owner | Project owner initial capture |
| Defect log owner | Project owner initial capture |

## 6. Defect Classification Table

Defect ID convention:

- `PILOT-001`, `PILOT-002`, `PILOT-003`, and so on
- use a three-digit running number
- do not reuse a previous defect ID
- open one defect record per distinct defect
- future feature requests belong in feedback or `S4 observation` unless they affect workflow safety or pilot comprehension

| Defect ID | Scenario | Severity | Summary | Suspected area | Triage decision | Owner | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| none | owner-led rehearsal summary | none | No functional defect was opened during the owner-led dry run | n/a | not a defect | Project owner | triaged | Rehearsal completed with `14 pass / 0 fail / 0 blocked / 0 defects` |

## 7. Feedback Classification Table

Use this for non-defect feedback, wording, training, and design observations.

| Feedback ID | Scenario | Type | Severity | Summary | Suggested action | Owner | Notes |
|---|---|---|---|---|---|---|---|
| FB-001 | R-02 to R-09 | usability / role expectation | S3 | Role-specific UI differentiation is still unclear; viewer, editor, manager, and admin look too similar in the current web UI, making permission boundaries harder to understand without trying actions | refine UX in a future scoped pass; do not change current workflow baseline during triage | Project owner | This is not a safety defect because the owner-led dry run did not show forbidden mutation being allowed |
| FB-002 | product review after login and KPI page navigation | future request | S4 | Organization-first dashboard landing page with hierarchical drill-down is desired instead of starting too deep on unit or team KPI pages | keep for future design phase | Project owner | See dashboard requirements for organization -> department/workgroup -> unit/team -> individual flow |

Dashboard requests during current pilot scope:

- record them as `S4 observation` or `future request`
- do not convert them directly into dashboard implementation work during current pilot rehearsal
- route them to [DASHBOARD_VISUALIZATION_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_VISUALIZATION_REQUIREMENTS.md) and future scope decision review

Captured owner-led rehearsal dashboard/navigation feedback:

- `S4 observation / future dashboard requirement`
- requirement: `Organization-first dashboard landing page with hierarchical drill-down`
- desired future flow: `Login -> Organization Dashboard Landing Page -> Department / Workgroup drill-down -> Unit / Team KPI page -> KPI entry detail`
- reason: current UI starts too deep in the hierarchy for executive or organization-level review
- follow-up document: [DASHBOARD_VISUALIZATION_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_VISUALIZATION_REQUIREMENTS.md)

Hospital role-model requests during current pilot scope:

- record them as `S4 observation` or future role-model requirement unless a current workflow safety issue is exposed
- do not convert them directly into role, permission, or RBAC implementation work during current pilot rehearsal
- route them to [ROLE_AND_SCOPE_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/ROLE_AND_SCOPE_REQUIREMENTS.md) and future scope decision review

## 8. Severity Rule

| Severity | Meaning | Typical outcome |
|---|---|---|
| `S1 blocker` | core rehearsal flow cannot continue or trust in the workflow is broken | pause and fix before any further pilot step |
| `S2 major` | workflow is usable only with significant confusion or risk | usually pause expansion and decide whether to fix before the next pilot step |
| `S3 minor` | workflow works but should be improved | refine wording, UX, or documentation |
| `S4 observation` | suggestion, training note, or future request | keep for backlog or design discussion |

Examples:

- `S1 blocker`: cannot login, valid KPI update cannot save, forbidden mutation is incorrectly allowed, audit missing after successful save
- `S2 major`: stale-write explanation is too unclear, audit history is misleading, role behavior contradicts rehearsal expectation
- `S3 minor`: wording issue, layout issue, small friction in data entry
- `S4 observation`: user suggestion, future workflow request, note about training material

## 9. Decision Options

Choose one primary decision after triage:

1. `proceed to limited internal pilot`
2. `refine wording/audit/UX only`
3. `pause feature expansion because S1/S2 issues exist`
4. `open next design phase`

Record the decision:

| Decision | Selected | Reason |
|---|---|---|
| proceed to limited internal pilot | no | The triage outcome is leaning toward a design decision rather than another pilot expansion step in this pass |
| refine wording/audit/UX only | no | There is a usability observation, but the more strategically important outcome is a dashboard design decision rather than a wording-only refinement |
| pause feature expansion because S1/S2 issues exist | no | No S1 or S2 defect was opened during the owner-led dry run |
| open next design phase | yes | Current workflow passed the owner-led dry run; no blocking defect was recorded; dashboard direction is strategically important and needs deliberate design before implementation |

## 10. Next-Phase Candidate List

Only consider a next design phase after triage is complete.

| Candidate | Open now? | Reason |
|---|---|---|
| Assignment and Due-Date Workflow Design | no | Not selected by current triage decision |
| KPI Template Import Design | no | Deferred until later scope review |
| Operational KPI Value Import Design | no | Deferred until later scope review |
| Dashboard/Aggregation Design | yes | Needed as a prerequisite to any future dashboard implementation |
| Dashboard and KPI Visualization Design Phase | yes | Recommended next phase from this triage, design only and no implementation yet |

Deferred requirement reminder:

- KPI Template Import affects `KPIDefinition`
- Operational KPI Value Import affects `KPIEntry` and `EntryValue`
- future import must support multiple formats including `.xlsx`, `.json`, `.csv`, and other appropriate validated formats
- no import workflow may bypass validation, concurrency, or audit
- future dashboard visualization requirement is captured in [DASHBOARD_VISUALIZATION_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_VISUALIZATION_REQUIREMENTS.md)
- dashboard implementation is deferred until controlled pilot rehearsal results and feedback triage are recorded

## 11. Scope Guard Rule

Until a triage decision is recorded here, do not start:

- import workflow
- dashboard or aggregation
- assignment editing
- due date editing
- advanced permission redesign

This rule applies even if requests or observations arise during rehearsal.

## 12. Recommended Action Summary

Use this section as the final triage output:

| Field | Value |
|---|---|
| primary decision | `open next design phase` |
| rationale | `Owner-led controlled rehearsal / internal dry run passed all 14 scenarios with no recorded defect. The most important follow-up is now a strategic dashboard design question, not a workflow safety repair.` |
| must-fix items before next step | `No S1 or S2 blocker remains open from the owner-led dry run.` |
| can-wait items | `FB-001 role-specific UI differentiation can wait for a future UX refinement pass; FB-002 dashboard landing and drill-down stays in design scope only for now.` |
| documentation updates needed | `Keep dashboard requirement docs, handoff, and next-phase plan aligned with the triage decision.` |
| next recommended action | `Authorize Dashboard and KPI Visualization Design Phase only. Do not implement dashboard UI, chart library, dashboard API, aggregation service, schema change, or landing page behavior in this pass.` |
