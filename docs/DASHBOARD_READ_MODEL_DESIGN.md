# Dashboard Read Model Design

**Status**: `design draft only`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Date**: `2026-05-29`

## 1. Purpose

This document describes the conceptual read model for future dashboard and KPI visualization behavior.

It does not implement:

- aggregation services
- SQL materialization
- migrations
- cache tables
- backend routes

## 2. Source Entities

Dashboard values should derive from the existing operational model:

- `KPIDefinition`
- `KPIEntry`
- `EntryValue`
- `ReportingPeriod`
- hierarchy node or KPI page ownership context
- audit history where relevant

Related semantic design input:

- [KPI_MEASUREMENT_MODEL_REQUIREMENTS.md](D:/home/github/healthcare-kpi-hub/docs/KPI_MEASUREMENT_MODEL_REQUIREMENTS.md)

## 3. Read Model Responsibilities

The dashboard read model should answer:

- what KPI population belongs to the current scope
- what reporting period is currently selected
- what workflow statuses exist in that scope
- what KPI measurement types exist in that scope
- what target rules and threshold semantics apply
- what achievement, risk, or overdue signals should be shown
- what child hierarchy nodes are available for drill-down
- what KPI items or entry links support investigation

## 4. Read Model Views

The future read model likely needs conceptual views such as:

### 4.1 Organization summary view

- period
- total KPI count
- status counts
- risk counts
- overdue counts
- achievement summary
- child department or workgroup summaries
- top issues and annotation summary

### 4.2 Department or workgroup summary view

- scope node
- period
- KPI counts
- status distribution
- achievement summary
- child unit or team summaries
- issue and annotation summary

### 4.3 Unit or team summary view

- scope node
- hierarchy context
- KPI item summaries
- actual vs target summary
- progress summary
- owner and due context
- entry links

### 4.4 KPI detail drill-down view

- link to current KPI entry detail
- status
- value payload
- audit history
- mutation availability based on workflow and permission

## 5. Lineage Rule

Every card, chart, table, or drill-down row must be able to answer:

- which `KPIDefinition` contributed
- which `KPIEntry` rows were counted
- which `ReportingPeriod` was selected
- which hierarchy node or owner scope was used
- which aggregation rule was applied
- which workflow statuses were included or excluded
- which downstream drill-down target the user can open
- which permission or scope rule allowed the data to be visible

If a dashboard element cannot explain its lineage, it is not ready for implementation.

## 6. Conservative Design Rule

The read model must be metadata-driven and rule-driven, not hardcoded.

Do not design around:

- hardcoded KPI codes for special handling
- hardcoded page names
- hardcoded department names
- hardcoded status formulas per one screen

Preferred design direction:

- status inclusion rules declared explicitly
- hierarchy traversal based on parent-child metadata
- KPI display driven by metadata on KPI definition and scope
- KPI calculation and visualization driven by KPI measurement semantics, not hardcoded route assumptions
- overdue and risk semantics derived from declared rules

## 7. Aggregation And Status Inclusion Matrix

The following questions remain design decisions and should not be hardcoded prematurely.

| Question | Default draft | Notes |
|---|---|---|
| `draft` counted in overview? | `yes, as workload` | not counted as final achievement by default |
| `pending` counted in overview? | `yes, as in-progress workload` | not counted as final achievement by default |
| `submitted` counted in overview? | `yes` | candidate for achievement numerator depending on KPI semantics |
| `locked` counted in overview? | `yes` | strongest candidate for final counted value |
| missing value handling | `TBD` | should likely appear as missing data or incomplete workload |
| stale or rejected value handling | `exclude from final achievement; include in warnings if relevant` | exact rule still open |
| overdue definition | `due date passed while not in final accepted state` | exact accepted states remain open |
| at-risk definition | `TBD` | may depend on target direction, progress trend, lateness, or validation gaps |
| achievement percentage formula | `TBD, conservative approach preferred` | likely count only validated or accepted states for final achievement |
| department roll-up rule | `aggregate from child scope under explicit rules` | no direct hardcoded summary |
| unit roll-up rule | `aggregate from unit-owned KPI entries under explicit rules` | scope-aware |
| individual roll-up rule | `derived from assigned KPI entries` | useful for workload and detail view |

Additional KPI semantics rule:

- percentage and ratio KPI aggregation should prefer numerator/denominator roll-up where data allows
- milestone KPI aggregation should not assume arithmetic averaging
- boolean KPI aggregation should prefer pass/fail counts or completion rate

## 8. Data Quality Warnings

Dashboard read model should support data quality warning concepts such as:

- no open reporting period
- missing values
- overdue entries
- stale or conflicting entry state
- excluded data due to invalid or unresolved state

Warnings should not be hidden inside charts only.

## 9. Annotation And Issue Roll-Up

Annotation, issue, and note summary should be represented as a first-class read-model concern.

Future design should define:

- whether all notes roll up or only flagged notes
- whether issue summaries are status-derived, note-derived, or both
- how to group annotations by hierarchy level
- how to avoid misleading counts from duplicate or low-signal notes

## 10. Read Model Acceptance Criteria

This design is sufficient when it explains:

- source entities
- hierarchy-based read-model levels
- lineage and traceability rules
- relationship to KPI measurement semantics and target rules
- conservative status inclusion defaults
- open questions that still need approval
- explicit avoidance of hardcoded behavior
