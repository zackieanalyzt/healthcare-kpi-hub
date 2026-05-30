# Dashboard Phase 1A Implementation Plan

**Status**: `implementation kickoff planning only`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Checkpoint baseline**: `c9fa6d4 docs: accept Phase 1A owner decision baseline`
**Date**: `2026-05-30`

## 1. Phase 1A Objective

Open the narrowest possible dashboard implementation slice that proves:

- KPI measurement metadata can support dashboard semantics
- organization-scope summary can be assembled from existing operational data
- one read-only backend API can expose an explainable organization summary

Phase 1A objective in one line:

`metadata foundation + organization summary backend only`

## 2. Implementation Boundary

Phase 1A must stay limited to:

- schema metadata foundation for approved KPI metadata
- backend model or validation only where needed for that metadata
- organization-scope read-model assembly only
- one read-only organization summary API only
- backend tests only for this scope

Phase 1A must not expand into hierarchy drill-down, UI work, or broader dashboard rollout.

## 3. Allowed Work

Allowed when Phase 1A implementation later opens:

1. schema or migration work only for accepted metadata foundation
2. validation updates required to support:
   - `measurement_type`
   - `measurement_unit`
   - `target_operator`
   - `target_value`
   - `target_direction`
   - `target_annotation`
   - `aggregation_method`
   - config-based `threshold_rules`
   - config-based denominator metadata
   - `milestone_levels`
3. backend read-model assembly for organization scope only
4. one read-only summary API for organization dashboard data
5. backend tests for metadata validation, organization summary semantics, lineage, warnings, and scope safety

## 4. Explicit Non-Goals

Still out of scope for Phase 1A:

- dashboard UI
- drill-down UI
- chart library installation
- materialized cache
- department or workgroup drill-down
- unit or team drill-down
- individual KPI detail screen
- import changes
- RBAC changes
- advanced aggregation
- KPI-specific hardcoded calculation

Also out of scope:

- broad workflow redesign
- due-date workflow redesign
- hierarchy model redesign
- template import work

## 5. Files And Areas Expected To Change When Implementation Starts

The exact files depend on current repository structure, but Phase 1A should expect changes only in narrow backend areas such as:

- schema or migration files for KPI metadata foundation
- backend model or validation modules related to KPI definition semantics
- backend service or read-model assembly module for organization summary only
- one read-only dashboard API route or handler
- backend tests covering:
  - metadata validation
  - organization summary behavior
  - warnings
  - lineage

Areas that should not change in Phase 1A:

- dashboard frontend pages or components
- navigation or default landing-page UI behavior
- chart dependencies
- import pipeline
- RBAC model
- KPI entry mutation flow

## 6. Migration / Schema Metadata Plan At High Level

Phase 1A schema work should follow the approved hybrid direction:

- explicit fields for stable first-pass metadata:
  - `measurement_type`
  - `measurement_unit`
  - `target_operator`
  - `target_value`
  - `target_direction`
  - `target_annotation`
  - `aggregation_method`
- config-based fields for:
  - `threshold_rules`
  - denominator metadata
  - `milestone_levels`
  - explainability helpers if needed

High-level migration expectations:

1. introduce metadata fields conservatively
2. preserve backward compatibility with current KPI reads and mutation behavior
3. keep incomplete metadata in explicit `not_configured` state rather than hardcoded fallback logic
4. avoid creating separate denominator or rule-engine tables in Phase 1A

## 7. Organization Summary Backend / API Plan At High Level

Backend read-model plan:

1. resolve reporting period and organization scope
2. read KPI definitions, assignments, entries, and accepted metadata inputs
3. apply accepted denominator status rules
4. derive `achievementStatus` from `target_rule` only
5. derive `riskStatus` from `threshold_rules` only
6. apply accepted overdue logic
7. exclude ambiguous scope cases from rolled-up denominator and emit warnings
8. attach minimum lineage fields and minimum warning set

API plan:

- expose one read-only organization summary endpoint only
- no drill-down endpoints in Phase 1A
- response should include at least:
  - scope metadata
  - period metadata
  - total KPI count
  - completed, pending, overdue, and at-risk summary counts as applicable
  - achievement summary
  - warning payloads
  - lineage payloads

Important rule:

the response must remain metadata-driven and must not encode KPI-specific meaning through hardcoded KPI codes.

## 8. Backend Test Plan

Phase 1A backend tests should cover at least:

1. metadata validation tests for required first-pass fields
2. status inclusion and denominator tests
3. overdue derivation tests
4. `achievementStatus` derivation tests
5. `riskStatus` derivation tests
6. unconfigured KPI handling tests
7. ambiguous scope exclusion and warning tests
8. organization summary response shape tests
9. minimum lineage field presence tests
10. regression checks confirming no KPI mutation behavior changes

## 9. Rollback And Compatibility Notes

Rollback and compatibility planning for Phase 1A should assume:

- current KPI page reads must keep working
- current KPI mutation behavior must remain unchanged
- missing metadata should degrade into explicit warning or `not_configured` states, not crashes
- schema rollout should be reversible without damaging existing operational data
- no frontend dependency should be introduced in this phase

Compatibility rule:

Phase 1A should be additive and conservative, not a rewrite of existing KPI flows.

## 10. Acceptance Criteria For Phase 1A

Phase 1A should be considered complete only when all of the following are true:

1. accepted KPI metadata foundation exists in backend schema/model layer
2. metadata validation supports the first-pass baseline
3. one organization-scope read-model assembly exists
4. one read-only organization summary API exists
5. accepted denominator and overdue rules are implemented
6. `achievementStatus` derives from `target_rule` only
7. `riskStatus` derives from `threshold_rules` only
8. missing `threshold_rules` never triggers inferred risk
9. unconfigured KPI handling follows the accepted baseline
10. minimum warning set is emitted where relevant
11. minimum lineage fields are emitted where relevant
12. no UI, drill-down, chart library, cache, import, RBAC, or advanced aggregation work is included
13. no KPI-specific calculation is hardcoded in application code

## 11. Kickoff Recommendation

When implementation is explicitly approved later, kickoff should proceed in this order:

1. metadata schema foundation
2. metadata validation
3. organization-scope read-model assembly
4. organization summary API
5. backend tests

This document does not start implementation.

It only defines the narrow kickoff plan to use once Phase 1A code work is explicitly approved.
