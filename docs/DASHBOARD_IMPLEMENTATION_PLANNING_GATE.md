# Dashboard Implementation Planning Gate

**Status**: `planning gate only`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Date**: `2026-05-29`

## 1. Purpose

This document defines the approval gate that must be satisfied before dashboard implementation planning begins.

It is not an implementation plan yet.

It does not approve:

- schema or migration work
- API implementation
- dashboard UI implementation
- chart library installation
- aggregation SQL
- import implementation
- RBAC redesign

## 2. Current Approved Design Baseline

Current approved design baseline includes:

- organization-first dashboard landing requirement
- hierarchy drill-down requirement from organization to department or workgroup to unit or team to individual KPI detail
- KPI measurement semantics requirement
- first-pass KPI metadata baseline
- threshold rule baseline where `target_rule` drives achievement and optional `threshold_rules` drive risk display
- metadata-driven and rule-driven design direction with no hardcoded KPI-specific calculations

## 3. What Is Approved For Planning

The following are approved as planning inputs only:

- dashboard hierarchy and UX flow discussion
- read-model design discussion
- API contract discussion
- KPI metadata placement discussion
- aggregation rule discussion
- scope and permission design discussion
- implementation gate and test strategy discussion

## 4. What Is Not Approved For Implementation Yet

The following remain out of scope until a later explicit approval:

- schema changes
- migration files
- seed changes
- API handlers or routes
- dashboard pages or components
- chart library installation
- aggregation SQL or materialized summary jobs
- frontend route or default landing-page behavior changes
- RBAC redesign

## 5. Required Decisions Before Schema Work

Planning must answer:

- where KPI measurement metadata should live:
  - `KPIDefinition`
  - KPI template metadata
  - JSON configuration
  - hybrid structure
- how first-pass metadata fields will be represented:
  - `measurement_type`
  - `measurement_unit`
  - `target_operator`
  - `target_value`
  - `target_direction`
  - `target_annotation`
  - `aggregation_method`
  - optional `threshold_rules`
  - milestone-only `milestone_levels`
- whether denominator metadata is template-level, period-level, or hybrid
- whether threshold rules use a generic rule structure or typed severity bands
- how metadata remains configuration-driven rather than hardcoded in application code

## 6. Required Decisions Before API Work

Planning must answer:

- whether the dashboard API starts with a scope-driven summary endpoint
- whether hierarchy drill-down uses node identifiers directly
- whether individual KPI drill-down reuses existing KPI detail read endpoints
- which semantic fields must appear in first-pass read models, including:
  - `measurementType`
  - `displayUnit`
  - `targetRule`
  - `targetAnnotation`
  - `achievementStatus`
  - `riskStatus`
  - `thresholdRules`
  - `numerator`
  - `denominator`
  - `aggregationMethod`
  - `lineageMeta`
  - `dataQualityWarnings`
- how `achievementStatus` and `riskStatus` remain explicit and not silently inferred

## 7. Required Decisions Before Dashboard UI Work

Planning must answer:

- which dashboard level is implemented first
- what summary cards appear at organization level
- what hierarchy controls are used for drill-down
- how read-only state appears for users without mutation permission
- how dashboard cards link to actionable lower-level KPI lists
- how KPI item summaries expose target explanation and risk explanation
- how role-specific UI differentiation improves without creating hardcoded role-page screens

## 8. Required Test Strategy

Planning must define:

- read-model lineage verification strategy
- KPI-type-specific calculation test coverage
- percentage numerator/denominator roll-up tests
- milestone aggregation and threshold mapping tests
- missing-threshold behavior tests
- permission and scope boundary tests
- stale or invalid data warning tests
- regression coverage that confirms current KPI mutation flow is unchanged

## 9. Required Security / Scope Checks

Planning must answer:

- how dashboard enforces `role + scope + permission`
- how drill-down avoids revealing KPI entries outside authorized scope
- how `viewer` remains read-only
- how `editor` visibility differs from manager-like oversight
- how `system_admin` stays separate from business executive approval semantics
- how dashboard summary queries avoid cross-scope leakage at aggregation level

## 10. Go / No-Go Checklist For Implementation Phase

Implementation planning should not open until all of these are true:

- owner approves current design baseline
- first-pass KPI measurement metadata baseline remains accepted
- threshold rule baseline remains accepted
- schema placement options are reviewed
- API contract direction is reviewed
- read-model strategy is reviewed
- security and scope constraints are reviewed
- no S1 or S2 workflow safety issues are open
- implementation scope is explicitly approved in a separate decision

## 11. Explicit Non-Goals

This planning gate does not:

- decide final schema columns
- decide final API field names
- approve dashboard implementation
- approve import implementation
- approve hardcoded KPI-specific calculation logic

If future calculation rules are needed, they must come from metadata, configuration, or rule-driven structures rather than one-off code branches.
