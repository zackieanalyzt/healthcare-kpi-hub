# Dashboard Read Model Design

**Status**: `planning only`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Checkpoint baseline**: `36e1c27 docs: plan dashboard schema metadata strategy`
**Date**: `2026-05-30`

## 1. Purpose

This document defines planning guidance for the future dashboard read model only.

It explains how the dashboard should eventually read and summarize existing operational data plus KPI measurement metadata for an organization-first dashboard with hierarchical drill-down:

`Organization Dashboard -> Department / Workgroup Summary -> Unit / Team Summary -> Individual KPI Detail`

This document does not implement:

- schema or migration changes
- seed changes
- API routes or handlers
- read-model services
- aggregation SQL
- cache tables or materialization jobs
- dashboard UI
- chart library installation
- frontend form changes
- KPI entry mutation behavior changes
- RBAC changes

Hard rule:

No KPI-specific calculation may be hardcoded in application code.

Any special logic must come later from metadata, configuration, or a rule registry.

## 2. Planning Baseline

This read-model planning must stay aligned with the approved design baseline:

- dashboard landing starts at organization scope
- drill-down proceeds through department or workgroup, then unit or team, then individual KPI detail
- first-pass supported `measurement_type` values are:
  - `percentage`
  - `count`
  - `milestone`
  - `boolean`
- deferred types remain out of first-pass implementation planning:
  - `ratio`
  - `score`
  - `currency`
  - `duration`
  - `custom`
- approved must-have metadata:
  - `measurement_type`
  - `measurement_unit`
  - `target_operator`
  - `target_value`
  - `target_direction`
  - `target_annotation`
  - `aggregation_method`
- approved optional or should-have metadata:
  - `threshold_rules`
  - denominator-related metadata
  - explainability helpers
  - chart preference metadata
- milestone KPI requires `milestone_levels`
- `achievementStatus` derives from `target_rule` only
- `riskStatus` derives from `threshold_rules` only when configured
- if `threshold_rules` are missing, `riskStatus` must remain explicit as `null`, `not_configured`, or another non-derived state

## 3. Source Data Inputs

The future dashboard read model should assemble data conceptually from the following source responsibilities.

### 3.1 KPI definition and semantic metadata

Primary responsibility:

- define KPI identity and semantics
- define measurement behavior
- define target behavior
- define aggregation behavior

Conceptual inputs:

- KPI definition master data
- `measurement_type`
- `measurement_unit`
- `target_operator`
- `target_value`
- `target_direction`
- `target_annotation`
- `aggregation_method`
- optional `threshold_rules`
- optional denominator-related metadata
- optional explainability metadata
- `milestone_levels` when `measurement_type = milestone`

### 3.2 KPI assignment and ownership data

Primary responsibility:

- define who owns or is responsible for KPI execution
- define organizational placement for read-model scope
- define drill-down path from organization to lower levels

Conceptual inputs:

- KPI assignment records
- KPI owner or responsible user
- hierarchy ownership node
- department, workgroup, unit, or team placement
- individual responsibility mapping where applicable

### 3.3 KPI entry and progress data

Primary responsibility:

- provide period-specific observed values and operational progress
- provide entry-level status and due context

Conceptual inputs:

- KPI entry records
- entry value records
- actual value payloads
- numerator and denominator payloads where supported later
- milestone progress payloads where supported later
- operational notes or issue annotations
- due dates and update timestamps

### 3.4 Workflow and status data

Primary responsibility:

- determine current operational status for inclusion, exclusion, and warning logic
- support denominator planning for summary counts

Conceptual inputs:

- workflow state on KPI entries
- state transition timestamps where available
- completion or approval markers where available
- overdue-relevant due and completion state data

### 3.5 Scope and hierarchy data

Primary responsibility:

- define the scope tree for roll-up and drill-down
- provide scope labels and parent-child traversal

Conceptual inputs:

- organization scope root
- department or workgroup nodes
- unit or team nodes
- user-to-scope mapping
- scope parent-child relationships

### 3.6 Audit and lineage data

Primary responsibility:

- explain where a dashboard value came from
- support troubleshooting and confidence checks

Conceptual inputs:

- source KPI definition identifiers
- source KPI entry identifiers
- source assignment identifiers
- reporting period identifiers
- last updated timestamps
- audit markers where currently available

## 4. Read Model Levels

The future read model should be planned as four conceptual levels.

### 4.1 Organization Dashboard

Scope key:

- `scope_type = organization`
- `scope_id = organization root or explicit organization scope key`

Aggregate fields that should exist:

- total KPI count
- completed KPI count
- pending or in-progress KPI count
- overdue KPI count
- at-risk KPI count
- achievement summary
- issue count
- annotation summary
- child scope summary list
- freshness and warning indicators

Drill-down target:

- department or workgroup summary

Should roll up:

- KPI counts across included child scopes
- status distribution
- achievement distribution
- risk distribution only where threshold metadata exists
- overdue workload
- summarized issue and annotation signals

Should not roll up:

- raw KPI-specific formulas
- milestone ladders as if they were simple averages
- KPI-specific chart rules into one global numeric summary without metadata
- risk inference for KPIs without `threshold_rules`

### 4.2 Department / Workgroup Summary

Scope key:

- `scope_type = department` or `workgroup`
- `scope_id = hierarchy node id`

Aggregate fields that should exist:

- KPI counts within the scope
- achievement summary for included KPIs
- risk summary for configured KPIs
- overdue summary
- child unit or team summaries
- issue and annotation summary
- last update and warning indicators

Drill-down target:

- unit or team summary

Should roll up:

- KPI counts for descendant scopes included by authorization
- workflow status counts
- warning counts
- per-KPI summary indicators needed for child scope comparison

Should not roll up:

- unauthorized descendant data
- raw detail history beyond what summary needs
- milestone semantics as arithmetic means by default

### 4.3 Unit / Team Summary

Scope key:

- `scope_type = unit` or `team`
- `scope_id = hierarchy node id`

Aggregate fields that should exist:

- KPI item list or KPI summary rows
- status distribution
- actual versus target summary
- achievement and risk status per KPI
- owner context
- due context
- issue and annotation signals
- last update and warning indicators

Drill-down target:

- individual KPI detail

Should roll up:

- unit-owned or team-owned KPI entries
- owner and due summaries
- workload counts

Should not roll up:

- entry mutation capability assumptions
- unrelated sibling scope data
- unauthorized individual detail

### 4.4 Individual KPI Detail

Scope key:

- `scope_type = kpi_entry`
- `scope_id = KPI entry id`

Fields that should exist conceptually:

- KPI identity
- scope identity
- owner identity
- reporting period
- actual value representation
- target metadata explanation
- achievement status
- risk status
- workflow status
- audit or lineage references
- data quality warnings

Drill-down target:

- current KPI entry detail route or aligned future detail read model

Should roll up:

- none; this is the terminal inspection view

Should not roll up:

- organization-level summary shortcuts
- hardcoded per-KPI display logic disconnected from metadata

## 5. Core Semantic Fields

The dashboard should use a common semantic field vocabulary across levels wherever possible.

### 5.1 Required fields

- `scope_type`
- `scope_id`
- `scope_name`
- `reporting_period_id`
- `reporting_period_key`
- `kpi_count_total`
- `last_updated_at`
- `lineage_ref`

Required means the read model should always try to provide the field, even when the value is an explicit empty state.

### 5.2 Required derived fields

- `kpi_count_completed`
- `kpi_count_pending`
- `kpi_count_overdue`
- `achievement_status`

These are derived from operational state plus approved rule semantics and should not be stored as hardcoded dashboard facts.

### 5.3 Optional derived fields

- `kpi_count_at_risk`
- `achievement_percent`
- `risk_status`
- `issue_count`
- `annotation_summary`
- `data_quality_warnings`

These fields may legitimately be unavailable, partial, or explicit non-derived states depending on metadata completeness and scope level.

### 5.4 Display-only or drill-down helper fields

- `scope_path`
- `child_scope_count`
- `drilldown_target`
- `display_unit`
- `target_annotation`
- `preferred_chart_type`
- `owner_summary`
- `status_distribution`

These fields improve UI rendering and explanation but should not redefine the underlying semantics.

### 5.5 Lineage-supporting fields

Recommended conceptual lineage support:

- `lineage_ref`
- `source_definition_refs`
- `source_entry_refs`
- `source_assignment_refs`
- `aggregation_rule_version`
- `threshold_rule_version`
- `calculated_at`

## 6. Achievement Calculation Planning

### 6.1 Core rule

`achievementStatus` must derive from the target rule only.

It must be based on approved metadata such as:

- `measurement_type`
- `target_operator`
- `target_value`
- `target_direction`
- `aggregation_method`

It must not derive from:

- `threshold_rules`
- hardcoded KPI codes
- hardcoded department names
- app code branches written for one KPI only

### 6.2 First-pass supported measurement types

First-pass read-model planning covers:

- `percentage`
- `count`
- `milestone`
- `boolean`

Deferred from first-pass implementation:

- `ratio`
- `score`
- `currency`
- `duration`
- `custom`

### 6.3 Conceptual derivation by type

#### `percentage`

Planning direction:

- compare computed or supplied percentage result against target rule
- when roll-up is needed, prefer metadata-approved aggregation behavior rather than naive averaging
- where numerator and denominator semantics exist, future implementation should prefer numerator and denominator roll-up if the metadata requires it

#### `count`

Planning direction:

- compare the relevant count value against the target rule
- aggregate according to approved `aggregation_method`

#### `milestone`

Planning direction:

- compare current milestone level against target milestone condition
- require `milestone_levels`
- do not treat milestone progress as ordinary arithmetic percentage unless metadata explicitly defines such an interpretation later

#### `boolean`

Planning direction:

- derive pass or fail from the true or false target condition
- no numeric threshold inference should be assumed by default

### 6.4 Output state planning

The future read model should support explicit states such as:

- `achieved`
- `not_achieved`
- `unknown`
- `not_configured`

Final enum naming remains an owner decision.

## 7. Threshold / Risk Planning

### 7.1 Core rule

`riskStatus` must derive from `threshold_rules` only.

`threshold_rules` are optional.

If `threshold_rules` are absent, the read model must not infer risk status from:

- KPI type alone
- current value alone
- workflow status alone
- overdue state alone

Instead, `riskStatus` must remain explicit as one of:

- `null`
- `not_configured`
- another approved non-derived state

### 7.2 Planning direction for threshold structures

Future threshold planning may support rule structures such as:

- green, yellow, red bands
- ordered severity labels
- band descriptions for display
- type-aware milestone bands where explicitly configured

This document does not approve a rule engine implementation yet.

### 7.3 Relationship between achievement and risk

The read model must keep these concepts separate:

- `achievementStatus` answers whether the KPI met the target rule
- `riskStatus` answers whether the KPI falls into a configured threshold band

These can differ.

Example:

- KPI may be `not_achieved` but still have `riskStatus = not_configured`
- KPI may be `achieved` while remaining in a cautionary risk band if threshold semantics are defined that way

## 8. Status Inclusion Planning

The future dashboard needs explicit status inclusion policy so summaries stay explainable.

### 8.1 Candidate statuses to plan around

- `draft`
- `active`
- `submitted`
- `reviewed`
- `approved`
- `completed`
- `overdue`
- `cancelled`
- `archived`

### 8.2 Conservative planning recommendation

Include in dashboard workload denominator by default:

- `draft`
- `active`
- `submitted`
- `reviewed`
- `approved`
- `completed`
- `overdue` when represented as a workflow-visible operational state or equivalent derived workload label

Exclude from default dashboard denominator:

- `cancelled`
- `archived`

### 8.3 Separate-display recommendation

Statuses that are excluded from main denominator should still be eligible for separate display or warning counts where useful:

- `cancelled`
- `archived`
- invalid or stale records if later distinguished separately

### 8.4 Final-state planning questions

The implementation phase still needs an owner-approved answer for:

- which statuses count as final accepted value states
- whether `approved` and `completed` are distinct or equivalent for dashboard summary
- whether `overdue` is a first-class workflow state, a date-derived label, or both
- whether `draft` should count in organization totals as workload only or also as KPI population

## 9. Permission / Scope Planning

This planning uses the rehearsal roles only:

- `viewer`
- `editor`
- `manager`
- `admin`

The planning principle is least privilege with no RBAC changes in this phase.

### 9.1 `viewer`

Should be planned as:

- read-only dashboard visibility within authorized scope
- can see organization or lower summaries only when current authorization scope permits it
- no KPI mutation behavior

### 9.2 `editor`

Should be planned as:

- dashboard visibility for own or assigned operational scope
- drill-down to individual KPI detail within scope
- dashboard read access must not imply broader managerial roll-up outside authorization scope

### 9.3 `manager`

Should be planned as:

- summary visibility across the managed scope
- drill-down into descendant scopes within authorization boundaries
- no cross-scope leakage to unrelated departments or units

### 9.4 `admin`

Should be planned as:

- broad technical visibility according to current system role behavior
- still conceptually separate from future business executive semantics

### 9.5 Scope resolution rule

Future dashboard reads should resolve visibility through:

`role + scope + permission context`

This document does not change current RBAC behavior.

## 10. Lineage Planning

Every dashboard summary, row, or card should be traceable back to its source inputs.

Recommended conceptual lineage fields:

- `lineage_ref`
- `source_definition_refs`
- `source_entry_refs`
- `source_assignment_refs`
- `source_scope_refs`
- `source_metadata_refs`
- `calculated_at`
- `aggregation_rule_version`
- `threshold_rule_version`
- `status_inclusion_version`

Lineage should be able to answer:

- which KPI definitions were counted
- which KPI entries were counted or excluded
- which scope node was used
- which reporting period was used
- which metadata set was used for target and threshold interpretation
- when the summary was calculated
- which rule version explained the result

## 11. Data Quality Warnings

The future read model should support explicit warning objects rather than hidden assumptions.

### 11.1 Recommended warning cases

- missing `measurement_type`
- missing target rule metadata
- missing `milestone_levels` for milestone KPI
- missing `threshold_rules` when a risk-oriented view is requested
- invalid `aggregation_method` for the configured `measurement_type`
- missing denominator metadata when denominator-based display is expected
- stale KPI entry data
- ambiguous scope ownership
- missing reporting period
- missing source assignment linkage

### 11.2 Warning behavior planning

Warnings should:

- be structured data
- remain visible at both summary and detail levels where relevant
- never silently trigger hardcoded fallback KPI logic
- allow the dashboard to show `not_configured`, `unknown`, or partial-summary states explicitly

## 12. Read-Model Strategy Recommendation

This section compares likely first-pass implementation strategies only.

### 12.1 Option A: on-demand query model

Description:

- query operational tables live for each dashboard request
- assemble summary at request time

Pros:

- simplest storage topology
- easiest to keep close to current operational source of truth
- no cache invalidation problem at first

Cons:

- query complexity may grow quickly
- repeated calculations can become expensive
- lineage and warning assembly may become noisy across many request paths

### 12.2 Option B: materialized read-model table

Description:

- persist a dedicated summary model for dashboard reads

Pros:

- fast dashboard reads
- stable summary payload shape
- easier executive-scale rendering later

Cons:

- refresh lifecycle complexity
- synchronization and correctness risk
- premature before status inclusion and KPI semantics are fully validated

### 12.3 Option C: hybrid cached summary model

Description:

- assemble summary from live operational reads but allow selective cached summary layers for high-level views later

Pros:

- balances explainability and future scalability
- leaves room for gradual optimization

Cons:

- more moving pieces than purely on-demand reads
- cache boundaries can become unclear if introduced too early

### 12.4 First-pass recommendation

Recommended first-pass implementation direction later:

`on-demand query retrieval + service-level read-model assembly`, with materialization deferred.

Reason:

- best fit for a first implementation that still needs explicit lineage, warnings, and rule transparency
- easier to validate status inclusion and measurement semantics before introducing cache synchronization
- safer for maintaining the no-hardcode principle while the KPI metadata contract is still stabilizing

Important note:

This is a planning recommendation only.

It does not authorize implementation.

## 13. Future Test Planning

No test code is added in this phase, but the future implementation should plan for at least:

- unit tests for achievement derivation by `measurement_type`
- unit tests for threshold or risk derivation
- unit tests for missing-threshold explicit-state behavior
- unit tests for invalid metadata warning generation
- integration tests for organization summary roll-up
- integration tests for department or workgroup drill-down
- integration tests for unit or team summary visibility
- scope and permission visibility tests for `viewer`, `editor`, `manager`, and `admin`
- data quality warning tests
- milestone KPI tests
- boolean KPI tests
- count KPI tests
- percentage KPI tests
- lineage trace tests
- status inclusion and exclusion tests
- regression tests confirming no KPI mutation behavior changes

## 14. Open Questions For Owner Decision

The following items still need explicit owner decisions before implementation:

- exact status inclusion rules for denominator and final accepted counts
- final `achievementStatus` enum naming
- final `riskStatus` enum naming
- source of truth for scope hierarchy when multiple ownership relationships exist
- default behavior when target metadata is incomplete
- whether unconfigured KPI should be shown separately in dashboard summaries
- whether overdue is workflow-derived, date-derived, or hybrid
- whether organization-level totals count all configured KPIs or only currently active KPI entries for the selected period
- whether issue count should come only from flagged annotations or also from workflow-derived warning states
- whether annotation summary should aggregate all notes or only issue-qualified notes
- whether `approved` and `completed` remain distinct in dashboard summaries
- whether a KPI without valid aggregation metadata should be excluded or included with warning-only treatment

## 15. Acceptance Summary For This Planning Phase

This document is sufficient for the current phase when it does all of the following:

- remains docs-only
- covers organization, department or workgroup, unit or team, and individual KPI detail planning
- defines conceptual source inputs
- defines common semantic fields
- keeps `achievementStatus` separate from `riskStatus`
- derives `achievementStatus` from target rule only
- derives `riskStatus` from `threshold_rules` only
- defines explicit behavior when `threshold_rules` are absent
- plans lineage and data quality warnings
- recommends a first-pass read-model strategy without implementing it
- outlines future test planning
- records open owner decisions before implementation begins
