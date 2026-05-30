# Dashboard Implementation Planning Gate

**Status**: `gate review only`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Checkpoint baseline**: `92c6afb docs: expand dashboard read-model planning baseline`
**Date**: `2026-05-30`

Owner review status:

`Dashboard planning is partially ready for a narrow future implementation opening, but it is not yet ready for broad dashboard implementation approval.`

## 1. Purpose

This document reviews whether current dashboard planning is mature enough to open a later implementation phase.

This is a docs-only gate review.

It does not approve or implement:

- schema or migration work
- seed changes
- API routes or handlers
- read-model services or queries
- dashboard UI
- chart library installation
- aggregation SQL
- import implementation
- frontend form changes
- KPI entry mutation behavior changes
- RBAC redesign
- dependency changes

## 2. Gate Status

Current gate status:

`partially ready`

Interpretation:

- the planning baseline is strong enough to support owner review of a narrow implementation opening
- the planning baseline is not yet strong enough to authorize full dashboard implementation across schema, read model, API, and UI all at once
- several owner decisions still need to be fixed before implementation starts

This review does not recommend `blocked`, because the design direction is coherent and substantial planning already exists.

This review does not recommend `ready`, because several prerequisites remain unresolved at decision level rather than documentation level.

## 3. Readiness Review Summary

### 3.1 Schema metadata planning

Status:

- `partially ready`

What is ready:

- first-pass metadata baseline is defined
- hybrid `explicit columns + JSON config` direction is documented
- core first-pass field placement is documented
- no-hardcode rule is explicit

What remains open:

- denominator metadata ownership: template-level, period-level, or hybrid
- future shape decisions for `target_value` and milestone target representation
- threshold rule structure: generic vs typed severity bands
- migration rollout and backfill policy still need later implementation-specific approval

Gate conclusion:

- schema planning is sufficient for owner review
- schema planning is not yet sufficient for schema execution approval

### 3.2 Read-model planning

Status:

- `partially ready`

What is ready:

- source data inputs are identified
- read-model levels are defined from organization down to individual KPI detail
- common semantic fields are proposed
- lineage and data quality warning planning exist
- read-model strategy recommendation exists

What remains open:

- exact denominator rules for dashboard totals
- exact final accepted states for summary calculations
- exact handling of unconfigured KPI in summary counts
- exact issue and annotation roll-up rules

Gate conclusion:

- read-model planning is structurally ready
- final implementation opening still depends on owner decisions for calculation boundaries and inclusion rules

### 3.3 API contract alignment

Status:

- `partially ready`

What is aligned:

- API draft follows organization-first and hierarchy drill-down planning
- API draft preserves separate `achievementStatus` and `riskStatus`
- API draft allows lineage and warning fields
- API draft prefers scope-driven summary plus drill-down links

What remains open:

- final field naming is still draft
- final enum naming is still draft
- final included status set is still open
- exact shape of summary cards and KPI item fields still depends on status inclusion and denominator decisions

Gate conclusion:

- API contract is directionally consistent with schema and read-model planning
- API contract is not yet frozen enough for implementation without owner review of remaining semantics

### 3.4 Achievement and risk semantics

Status:

- `mostly ready`

What is ready:

- `achievementStatus` derives from `target_rule` only
- `riskStatus` derives from `threshold_rules` only
- absence of `threshold_rules` must produce explicit non-derived risk state
- first-pass supported measurement types are constrained and documented

What remains open:

- final enum labels for achievement and risk
- exact handling of incomplete metadata for partial summaries

Gate conclusion:

- semantics are clear enough to prevent accidental coupling
- enum and fallback details still need owner confirmation

### 3.5 Status inclusion and denominator rules

Status:

- `not ready for implementation approval`

Current issue:

- the docs provide conservative planning guidance, but they do not yet fix the authoritative rules for:
  - which statuses count in dashboard denominator
  - which statuses count as final accepted value states
  - whether overdue is workflow-derived, date-derived, or hybrid
  - whether draft contributes to workload only, KPI population, or both

Gate conclusion:

- this is one of the main remaining decision areas before implementation starts

### 3.6 Permission and scope planning

Status:

- `partially ready`

What is ready:

- least-privilege direction is documented
- role set for current rehearsal context is clear
- no cross-scope leakage rule is explicit

What remains open:

- source of truth for hierarchy scope when ownership relationships are ambiguous
- exact first-pass behavior for `admin` vs future executive-like visibility
- exact behavior when a user has mixed assignment and managerial visibility

Gate conclusion:

- sufficient for planning review
- insufficient for implementation without explicit scope-resolution decisions

### 3.7 Lineage and data quality warnings

Status:

- `mostly ready`

What is ready:

- lineage concepts are explicit
- warning categories are documented
- read model and API both reserve space for warning and lineage data

What remains open:

- final minimum lineage field set for first implementation
- exact warning severity or display grouping
- exact handling of incomplete lineage in summary responses

Gate conclusion:

- strong enough for narrow implementation planning
- still needs one owner-approved minimum set for first release scope

## 4. Implementation Prerequisites

Before any dashboard implementation phase opens, the following should be explicitly approved:

1. authoritative status inclusion rules for dashboard denominator and final accepted calculations
2. authoritative overdue rule:
   - workflow-derived
   - date-derived
   - hybrid
3. authoritative handling of KPI without complete target metadata
4. authoritative handling of KPI without `threshold_rules`
5. authoritative handling of unconfigured KPI in summaries:
   - include with warning
   - exclude with warning
   - show in separate bucket
6. source of truth for hierarchy scope and ownership resolution
7. final enum naming direction for:
   - `achievementStatus`
   - `riskStatus`
8. explicit first implementation slice approval so scope does not expand accidentally

Implementation should still remain narrow even after these are approved.

## 5. Owner Decisions Required

The following owner decisions are still required before implementation should begin:

### 5.1 Status and denominator decisions

- which KPI statuses count in organization summary denominator
- which statuses count as final accepted achievement inputs
- whether `approved` and `completed` are distinct in summary logic
- whether `draft` counts as workload only or also as KPI population
- whether `cancelled` and `archived` are excluded entirely or shown in side buckets

### 5.2 Overdue decision

- whether overdue is:
  - workflow-derived
  - date-derived
  - hybrid

### 5.3 Scope and ownership decisions

- what the source of truth is for scope hierarchy
- how ambiguous ownership is resolved
- whether assignment scope or managerial scope wins when they differ

### 5.4 Metadata behavior decisions

- denominator metadata ownership model
- threshold rule structure direction
- default behavior when target metadata is incomplete
- default behavior when aggregation metadata is invalid

### 5.5 Presentation-semantics decisions

- final enum labels for `achievementStatus`
- final enum labels for `riskStatus`
- whether issue count includes workflow-derived warning states or flagged annotations only
- whether annotation summary includes all notes or only issue-qualified notes

## 6. Recommended First Implementation Phase

If the owner decides to open implementation later, the narrowest recommended first phase is:

`Phase 1A: metadata foundation + organization summary backend only`

Recommended scope of that future phase:

1. schema work only for approved KPI metadata foundation
2. read-model assembly only for `organization` scope
3. one read-only summary API only for organization-level dashboard summary
4. no drill-down UI yet
5. no chart library yet
6. no materialized cache yet
7. no department, unit, or individual dashboard UI yet

Why this is the narrowest safe opening:

- it validates metadata completeness and achievement or risk semantics early
- it keeps permission and scope complexity smaller than full hierarchy rollout
- it limits blast radius before drill-down and child-scope aggregation are introduced
- it allows lineage and warning patterns to be proven before broader UI work

Recommended implementation order within that future phase:

1. schema metadata foundation
2. validation rules for metadata completeness
3. organization summary read-model assembly
4. read-only organization summary API
5. tests for achievement, risk, warnings, and scope visibility

This is a recommendation only.

It is not implementation approval.

## 7. Explicit Non-Goals

This gate review does not:

- approve full dashboard implementation
- approve hierarchy drill-down implementation
- approve dashboard UI implementation
- approve chart library selection or installation
- approve materialized summaries or cache jobs
- approve import implementation
- approve frontend route changes
- approve KPI mutation changes
- approve RBAC redesign

## 8. Scope Guard Confirmation

This review confirms that the current round remains:

- `docs-only`
- `review-only`

Nothing in this review authorizes:

- schema or migration implementation
- seed changes
- API route implementation
- service or query implementation
- read-model code implementation
- dashboard UI implementation
- chart library installation
- aggregation SQL
- import implementation
- frontend form changes
- KPI entry mutation behavior changes
- RBAC changes
- dependency changes
- hardcoded KPI-specific calculation

## 9. Go / No-Go Recommendation

Current recommendation:

- `No-Go for broad dashboard implementation`
- `Conditional Go for owner approval of a narrow future implementation slice only after the required decisions in this document are resolved`

Practical meaning:

- do not open full dashboard implementation yet
- finish owner decisions first
- if implementation is approved afterward, start with the narrowest backend-first slice rather than schema + API + UI + hierarchy all together

## 10. Acceptance Summary

This gate review is complete for the current round when it clearly states:

- gate status
- implementation prerequisites
- owner decisions required
- recommended first implementation phase
- explicit non-goals
- scope guard confirmation
