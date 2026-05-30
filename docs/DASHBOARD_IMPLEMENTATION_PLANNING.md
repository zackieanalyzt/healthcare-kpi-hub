# Dashboard Implementation Planning

**Status**: `implementation planning only`
**Approved by project owner**: `planning only`
**Checkpoint baseline**: `436e509 docs: prepare KPI measurement baseline approval`
**Date**: `2026-05-30`

## 1. Purpose

This document captures dashboard implementation planning only.

It prepares the project for later schema, read-model, API, and UI implementation decisions without authorizing implementation work in this phase.

This document does not implement:

- schema or migration changes
- seed changes
- API routes or handlers
- dashboard UI
- chart library installation
- aggregation SQL
- import implementation
- frontend form changes
- KPI mutation behavior changes
- RBAC changes

## 2. Approved Baseline

Project-owner approval for this phase is limited to implementation planning only.

Approved first-pass measurement types:

- `percentage`
- `count`
- `milestone`
- `boolean`

Deferred measurement types:

- `ratio`
- `score`
- `currency`
- `duration`
- `custom`

Approved must-have metadata:

- `measurement_type`
- `measurement_unit`
- `target_operator`
- `target_value`
- `target_direction`
- `target_annotation`
- `aggregation_method`

Approved optional or should-have metadata:

- `threshold_rules`
- `numerator_label`
- `denominator_label`
- `denominator_source`
- `default_denominator_value`
- `calculation_formula_label`
- `preferred_chart_type`

Milestone-only must-have:

- `milestone_levels`

Approved rule split:

- `target_rule` = pass/fail or achievement condition
- `threshold_rules` = optional risk / traffic-light / alert classification
- `achievementStatus` derives from `target_rule`
- `riskStatus` derives from `threshold_rules` only when configured
- missing `threshold_rules` must produce an explicit non-derived state such as `null` or `not_configured`

Hard rule:

No KPI-specific calculation may be hardcoded in application code.

Any special rule must come from:

- metadata
- configuration
- rule registry

## 3. Schema / Metadata Placement Options

The project needs a durable home for KPI semantics without locking itself into inflexible one-off columns too early.

### Option A: Explicit columns on `KPIDefinition`

Pros:

- strong validation
- simple querying for core metadata
- clear schema lineage

Cons:

- schema grows quickly as KPI semantics expand
- less flexible for milestone and future custom structures
- migration churn risk is high

### Option B: JSON config on `KPIDefinition`

Pros:

- flexible
- easier to evolve for future KPI types
- good fit for structured threshold and milestone data

Cons:

- weaker validation by default
- harder to query safely
- easier to drift into inconsistent metadata shapes

### Option C: Hybrid explicit columns plus JSON config

Pros:

- core first-pass metadata stays explicit and queryable
- structured optional semantics can live in JSON
- better balance between validation and flexibility

Cons:

- requires disciplined boundary between explicit fields and JSON
- can become confusing if ownership of fields is not documented clearly

### Option D: Separate KPI template metadata table

Pros:

- normalization
- cleaner separation from the operational definition table
- easier future import alignment

Cons:

- adds joins and more moving pieces in first implementation
- may be premature if template lifecycle is not implemented yet

### Recommended first-pass planning direction

Recommend `Option C: hybrid explicit columns plus JSON config`.

Rationale:

- the approved must-have metadata is stable enough to justify explicit first-pass fields
- optional structures such as `threshold_rules` and `milestone_levels` fit better as structured configuration
- this avoids forcing all future semantics into top-level columns
- it supports strong validation on core fields while keeping room for safe evolution

Recommended planning split:

- explicit first-pass fields for:
  - `measurement_type`
  - `measurement_unit`
  - `target_operator`
  - `target_value`
  - `target_direction`
  - `target_annotation`
  - `aggregation_method`
- structured config for:
  - `threshold_rules`
  - `milestone_levels`
  - denominator-related optional semantics
  - future chart preferences

## 4. Read Model Strategy

Candidate strategies:

### Option A: Live query aggregation

Pros:

- simplest initial topology
- no separate cache lifecycle

Cons:

- query complexity grows quickly
- risk of duplicated calculation logic
- harder to preserve explainable lineage cleanly

### Option B: Service-level read model assembly

Pros:

- explicit rule-driven calculation layer
- easier to test by KPI type
- easier to keep lineage, warnings, and permission filters together

Cons:

- still depends on underlying live queries
- can become slow if query planning is poor

### Option C: Materialized or cache table

Pros:

- fast dashboard reads
- easier executive-scale summary rendering

Cons:

- synchronization complexity
- harder correctness story early on
- premature before rule design stabilizes

### Recommended first-pass planning direction

Recommend:

1. live query data retrieval
2. service-level read model assembly
3. explicitly defer materialized or cache strategy

Rationale:

- keeps first implementation explainable
- centralizes KPI semantics logic in a testable service layer
- avoids premature caching before status inclusion and aggregation rules are fully proven

## 5. API Strategy

Recommended first-pass API direction:

- use a scope-driven summary endpoint for top-level summaries
- use a hierarchy drill-down endpoint for lower-level navigation
- reuse existing KPI entry detail endpoint wherever possible

Preferred shape:

- `GET /api/dashboard/summary?scope=organization&period=...`
- `GET /api/dashboard/summary?scope=department&nodeId=...&period=...`
- `GET /api/dashboard/summary?scope=unit&nodeId=...&period=...`
- `GET /api/dashboard/hierarchy/:nodeId`

Preferred detail linking:

- summary results expose `entryId`
- UI navigates to existing KPI entry detail read route for final inspection

Rationale:

- summary API and detailed KPI read model should not duplicate each other unnecessarily
- drill-down should stay hierarchy-driven
- semantic fields should be exposed consistently across summary levels

## 6. Calculation / Rule Strategy

### Percentage

- preserve numerator and denominator semantics
- prefer numerator/denominator roll-up
- never blindly average percentages
- expose both computed result and source context where needed

### Count

- sum only when scope and semantics are compatible
- compare against `target_rule` using declared operator

### Milestone

- use ordered milestone levels
- compare current level against target level
- aggregate as distribution or target-achieved count, not arithmetic average

### Boolean

- treat as pass/fail or completion state
- aggregate as pass count, fail count, or completion rate

### Shared calculation rule

No KPI type should rely on one-off `if KPI code == ...` logic in application code.

All behavior should come from:

- approved metadata
- calculation strategy registry
- explicit rule mapping by measurement type

## 7. Threshold / Risk Strategy

Baseline planning rule:

- `achievementStatus` comes from `target_rule`
- `riskStatus` comes from `threshold_rules`

If threshold rules are missing:

- `riskStatus` must be explicit non-derived state
- examples:
  - `null`
  - `not_configured`
  - `unclassified`

Planning consequence:

- API and read model must expose achievement and risk separately
- UI must not guess risk from KPI type alone
- dashboards may show achievement without risk classification when thresholds are absent

## 8. Permission / Scope Strategy

Dashboard must enforce:

- `role + scope + permission`

Planning rules:

- summary queries must respect authorized scope before aggregation
- drill-down must not reveal KPI entries outside user authorization scope
- hierarchy traversal must be scope-filtered, not only display-filtered
- cross-scope aggregation leakage must be treated as security defect
- `viewer` remains read-only
- `editor` may see dashboard scope but mutation remains governed by existing workflow and permission rules
- `system_admin` must remain separate from business executive approval semantics

First-pass planning direction:

- authorization filtering should happen before summary roll-up whenever possible
- lineage metadata should include scope source so summary visibility remains auditable

## 9. Test Strategy

Implementation planning should require tests for:

- metadata validation
- first-pass measurement type acceptance and rejection
- percentage numerator/denominator calculation
- protection against blind percentage averaging
- milestone target achievement
- milestone aggregation behavior
- boolean completion aggregation
- threshold-based `riskStatus`
- missing-threshold explicit non-derived behavior
- permission and scope filtering
- prevention of cross-scope aggregation leakage
- read-model lineage and traceability
- regression coverage confirming current KPI mutation flow is unchanged

## 10. Implementation Slicing Proposal

This is a future approval proposal only.

Recommended slicing:

1. schema and metadata foundation
2. sample metadata update for first-pass KPI definitions
3. rule-driven read-model service
4. dashboard summary API
5. read-only organization dashboard prototype
6. hierarchy drill-down
7. chart refinement and UX polish

Reason for this order:

- semantics must exist before reliable summary logic
- read model must stabilize before UI polish
- read-only dashboard is a safer first delivery than editable dashboard interaction

## 11. Risks

- schema bloat if explicit fields grow without discipline
- metadata becomes too flexible to validate safely
- wrong aggregation produces believable but false numbers
- permission leakage through summary roll-up or drill-down
- hardcoded KPI logic creeps back during implementation pressure
- visually polished dashboard ships with numbers users cannot explain

## 12. Go / No-Go Checklist Before Implementation

Implementation must not begin until all are true:

- project owner confirms planning approval is sufficient to open implementation phase
- metadata placement strategy is explicitly approved
- read-model strategy is explicitly approved
- API direction is explicitly approved
- permission and scope strategy is explicitly approved
- test strategy is explicitly approved
- current workflow baseline remains protected
- no hardcoded KPI-specific calculation approach is proposed
- non-goals remain respected for any still-deferred phase

## 13. Explicit Non-Goals

This planning document does not approve:

- schema or migration execution
- seed changes
- route implementation
- UI implementation
- chart library installation
- aggregation SQL
- import implementation
- form redesign
- KPI mutation redesign
- RBAC redesign
