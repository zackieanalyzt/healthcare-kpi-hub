# Pilot Feedback Triage

**Purpose**: Structured triage for controlled pilot rehearsal feedback and scope decisions
**Baseline checkpoint**: `c312ea6 docs: capture KPI dashboard visualization requirements`
**Previous baseline**: `9da19ff docs: align pilot rehearsal logistics`
**Earlier baseline**: `82fc153 docs: harden controlled pilot rehearsal package`
**Current status**: `for post-rehearsal triage only`

## 1. Purpose

This document turns rehearsal results into a clear decision. It exists to prevent premature feature expansion and to ensure that feedback from a small controlled pilot rehearsal is reviewed consistently before the project moves forward.

This document must not be used to justify broad rollout without evidence from rehearsal execution.

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
| rehearsal date | |
| checkpoint under review | `c312ea6` or later reviewed checkpoint |
| facilitator | |
| triage owner | |
| decision owner | |
| total testers | |
| total scenarios planned | 14 |
| total scenarios executed | |
| pass count | |
| fail count | |
| blocked count | |
| not-run count | |
| defect count | |
| recommendation summary | |

## 4. Participant / Tester Summary

Keep this lightweight and avoid detailed personal information.

| Tester label | Work context | Role tested | Browser | Notes |
|---|---|---|---|---|
| T-01 | | viewer | | |
| T-02 | | editor | | |
| T-03 | | manager | | |
| T-04 | | admin | | |

## 5. Ownership

Fill these fields before triage starts:

| Field | Value |
|---|---|
| Facilitator | Digital health team lead |
| Triage owner | Project owner |
| Decision owner | Project owner and steering reviewer |
| Evidence owner | Assigned facilitator assistant |
| Defect log owner | Assigned dev recorder |

## 6. Defect Classification Table

Defect ID convention:

- `PILOT-001`, `PILOT-002`, `PILOT-003`, and so on
- use a three-digit running number
- do not reuse a previous defect ID
- open one defect record per distinct defect
- future feature requests belong in feedback or `S4 observation` unless they affect workflow safety or pilot comprehension

| Defect ID | Scenario | Severity | Summary | Suspected area | Triage decision | Owner | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| | | S1 / S2 / S3 / S4 | | auth/session / RBAC / navigation / worklist / KPI page / KPI entry detail / mutation / stale-write/concurrency / audit history / Thai/English message / data seed / other | fix before pilot / fix after pilot / documentation only / not a defect / needs design decision | | open / triaged / resolved | |

## 7. Feedback Classification Table

Use this for non-defect feedback, wording, training, and design observations.

| Feedback ID | Scenario | Type | Severity | Summary | Suggested action | Owner | Notes |
|---|---|---|---|---|---|---|---|
| | | wording / usability / training / audit readability / role expectation / future request | S1 / S2 / S3 / S4 | | refine wording / refine UX / add documentation / keep for future design phase / no action | | |

Dashboard requests during current pilot scope:

- record them as `S4 observation` or `future request`
- do not convert them directly into dashboard implementation work during current pilot rehearsal
- route them to [DASHBOARD_VISUALIZATION_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_VISUALIZATION_REQUIREMENTS.md) and future scope decision review

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
| proceed to limited internal pilot | yes / no | |
| refine wording/audit/UX only | yes / no | |
| pause feature expansion because S1/S2 issues exist | yes / no | |
| open next design phase | yes / no | |

## 10. Next-Phase Candidate List

Only consider a next design phase after triage is complete.

| Candidate | Open now? | Reason |
|---|---|---|
| Assignment and Due-Date Workflow Design | yes / no | |
| KPI Template Import Design | yes / no | |
| Operational KPI Value Import Design | yes / no | |
| Dashboard/Aggregation Design | yes / no | |
| Dashboard and KPI Visualization Design Phase | yes / no | |

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
| primary decision | |
| rationale | |
| must-fix items before next step | |
| can-wait items | |
| documentation updates needed | |
| next recommended action | |
