# Dashboard Owner Decision Acceptance

**Status**: `owner acceptance record only`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Checkpoint baseline**: `4d106cd docs: record dashboard owner decision closure`
**Date**: `2026-05-30`

## 1. Purpose

This document records the accepted owner baseline required before opening:

`Phase 1A: metadata foundation + organization summary backend only`

This is a docs-only owner-decision record.

It does not implement:

- schema or migration changes
- seed changes
- API implementation
- service, query, or read-model implementation
- dashboard UI
- chart library installation
- aggregation SQL
- import implementation
- frontend form changes
- KPI entry mutation behavior changes
- RBAC changes
- test implementation
- dependency changes

Hard rules preserved:

- `achievementStatus` derives from `target_rule` or achievement condition only
- `riskStatus` derives from `threshold_rules` only
- if `threshold_rules` are absent, risk must not be inferred
- KPI-specific calculation must not be hardcoded in application code
- any special formula must come from metadata, configuration, or rule registry only

## 2. Acceptance Summary

Owner-accepted baseline for Phase 1A is recorded in this document for the following decisions:

1. status inclusion and denominator rules
2. overdue rule
3. scope hierarchy source of truth
4. mixed-scope ownership behavior
5. `achievementStatus` enum naming
6. `riskStatus` enum naming
7. unconfigured KPI and incomplete metadata handling
8. denominator metadata ownership model
9. threshold rule structure direction
10. minimum first-pass data quality warnings
11. minimum first-pass lineage fields

## 3. Accepted Baseline Decisions

### 3.1 Status inclusion and denominator rules

Accepted baseline:

- include in denominator:
  - `active`
  - `submitted`
  - `reviewed`
  - `approved`
  - `completed`
  - `overdue`
- exclude from denominator:
  - `draft`
  - `cancelled`
  - `archived`

Acceptance notes:

- if the existing repository uses different status names, Phase 1A must map these baseline categories to current operational states without changing workflow behavior
- denominator must represent operationally active KPI population for organization summary

Impact on Phase 1A:

- organization summary denominator can be fixed for backend-only implementation
- achievement percent must not be based on `draft`, `cancelled`, or `archived`

Still deferred:

- any richer side-bucket or secondary-display strategy for excluded statuses

Decision status:

- `accepted`

### 3.2 Overdue rule

Accepted baseline:

- use a hybrid overdue rule with date-derived logic as the first-pass source of truth
- baseline definition:
  - overdue = `active`, `submitted`, `reviewed`, or `approved` KPI that has passed due date and is not yet `completed`
- if an explicit workflow status `overdue` already exists, treat it as explicit overdue too

Acceptance notes:

- Phase 1A must not change workflow behavior
- overdue is allowed to be a dashboard-derived condition even when workflow does not explicitly manage it

Impact on Phase 1A:

- overdue count and overdue warning logic can be implemented consistently in the organization summary backend

Still deferred:

- any future workflow redesign that formalizes overdue transitions

Decision status:

- `accepted`

### 3.3 Scope hierarchy source of truth

Accepted baseline:

- use the existing organization, department, workgroup, unit, team, and user ownership data already present in the system as the source of truth
- do not create a new hierarchy model in Phase 1A unless later work proves it is necessary

Acceptance notes:

- hierarchy planning must remain conservative and reuse current operational ownership structures

Impact on Phase 1A:

- organization-scope summary can rely on existing scope relationships
- hierarchy-model invention is explicitly out of scope for the first implementation slice

Still deferred:

- any future normalized hierarchy redesign

Decision status:

- `accepted`

### 3.4 Mixed-scope ownership behavior

Accepted baseline:

- if ownership is ambiguous or mixed-scope cannot be resolved confidently:
  - exclude the affected KPI from rolled-up denominator
  - emit a data quality warning
- do not infer or guess scope

Acceptance notes:

- this is the conservative least-privilege behavior for Phase 1A

Impact on Phase 1A:

- prevents cross-scope misclassification and false roll-up
- requires warning support in the backend response shape

Still deferred:

- richer reconciliation policy for mixed managerial and assignment scope in later phases

Decision status:

- `accepted`

### 3.5 `achievementStatus` enum naming

Accepted baseline:

- `not_started`
- `in_progress`
- `achieved`
- `not_achieved`
- `not_configured`
- `not_applicable`

Acceptance notes:

- `achievementStatus` must derive from `target_rule` or achievement condition only
- it must not be derived from `threshold_rules`

Impact on Phase 1A:

- backend naming can be frozen before implementation starts
- organization summary logic can distinguish configured but incomplete KPI from fully achieved KPI

Still deferred:

- any later display aliasing or localization choices

Decision status:

- `accepted`

### 3.6 `riskStatus` enum naming

Accepted baseline:

- `not_configured`
- `on_track`
- `watch`
- `at_risk`
- `critical`
- `not_applicable`

Acceptance notes:

- `riskStatus` must derive from `threshold_rules` only
- if `threshold_rules` are absent, return `not_configured` or another explicit non-derived state from this accepted set
- risk must not be inferred from KPI type, workflow status, or value alone when threshold metadata is absent

Impact on Phase 1A:

- threshold-based risk classification can be planned with stable naming
- missing threshold metadata can remain explicit rather than hidden

Still deferred:

- exact color mapping or visualization styling

Decision status:

- `accepted`

### 3.7 Unconfigured KPI and incomplete metadata handling

Accepted baseline:

- KPI with incomplete metadata must not cause dashboard failure
- if KPI is in an included operational status:
  - keep it visible in total KPI count
  - set `achievementStatus = not_configured`
  - set `riskStatus = not_configured`
  - emit one or more data quality warnings
  - exclude it from `achievement_percent` numerator

Acceptance notes:

- this preserves visibility while preventing false achievement claims

Impact on Phase 1A:

- backend summary logic must support partial but non-crashing KPI handling
- achievement percent remains conservative

Still deferred:

- any later separate UI bucket for unconfigured KPI beyond backend flags and counts

Decision status:

- `accepted`

### 3.8 Denominator metadata ownership model

Accepted baseline:

- denominator metadata remains part of KPI measurement metadata or configuration for Phase 1A
- do not create a separate denominator service or table in Phase 1A

Acceptance notes:

- this keeps denominator behavior aligned with the approved hybrid metadata direction

Impact on Phase 1A:

- schema and validation planning can remain narrow
- percentage KPI semantics stay metadata-driven

Still deferred:

- richer period-level override mechanics if later needed

Decision status:

- `accepted`

### 3.9 Threshold rule structure direction

Accepted baseline:

- use JSON or config-based `threshold_rules` as the first-pass baseline
- do not implement a complex rule engine in Phase 1A
- do not hardcode KPI-specific calculation

Acceptance notes:

- any special behavior must come from metadata, configuration, or rule registry only

Impact on Phase 1A:

- backend can validate and interpret threshold metadata conservatively without introducing a large engine design

Still deferred:

- more advanced typed rule engine behavior beyond the minimum config contract

Decision status:

- `accepted`

### 3.10 Minimum first-pass data quality warnings

Accepted baseline:

Phase 1A must support at least:

- `missing_measurement_type`
- `missing_target_rule`
- `missing_threshold_rules`
- `missing_milestone_levels`
- `invalid_aggregation_method`
- `ambiguous_scope`
- `stale_progress_data`

Acceptance notes:

- warnings should be structured data, not only prose strings
- `missing_threshold_rules` does not mean crash or inferred risk; it means explicit non-derived risk state plus warning where relevant

Impact on Phase 1A:

- minimum warning taxonomy is now fixed enough for backend response planning

Still deferred:

- broader warning sets beyond these minimum required warnings

Decision status:

- `accepted`

### 3.11 Minimum first-pass lineage fields

Accepted baseline:

Phase 1A must plan for at least:

- `kpi_definition_id`
- `assignment_id`
- `scope_type`
- `scope_id`
- `measurement_metadata_version_or_updated_at`
- `calculation_timestamp`
- `source_entry_updated_at`

Acceptance notes:

- lineage must be sufficient to explain organization summary output at audit and troubleshooting level

Impact on Phase 1A:

- backend read model and API planning can freeze a minimum lineage contract

Still deferred:

- richer lineage expansion beyond this minimum set

Decision status:

- `accepted`

## 4. Phase 1A Boundary Confirmation

After this owner acceptance baseline, the only implementation phase that may be opened later is still:

`Phase 1A: metadata foundation + organization summary backend only`

Allowed in Phase 1A later:

- schema metadata foundation
- organization-scope read-model assembly
- one read-only organization summary API
- backend-only validation

Not allowed in Phase 1A:

- dashboard UI
- drill-down UI
- chart library
- materialized cache
- department or workgroup drill-down
- unit or team drill-down
- individual KPI detail screen
- import changes
- RBAC changes
- advanced aggregation

## 5. Remaining Deferred Decisions

The following can remain deferred after this acceptance without blocking Phase 1A:

- exact department/workgroup drill-down payload design
- exact unit/team drill-down payload design
- chart preference usage and chart library choice
- materialized cache strategy
- richer issue and annotation roll-up beyond minimum backend policy
- broader warning taxonomy beyond the accepted minimum set
- richer lineage fields beyond the accepted minimum set
- any future hierarchy redesign beyond existing ownership structures

## 6. Readiness Statement

After this acceptance record, Phase 1A may be considered:

- `decision-ready`

But still not yet implemented.

This document does not itself open implementation work.

It records the accepted owner baseline that must govern the next approval step before any code work begins.
