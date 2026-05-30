# Dashboard Owner Decisions

**Status**: `decision record with accepted follow-up baseline`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Checkpoint baseline**: `12eee8a docs: review dashboard implementation gate readiness`
**Date**: `2026-05-30`

## 1. Purpose

This document records the owner-decision topics used to close the dashboard implementation gate.

It is a decision-record-only document.

Accepted owner baseline reference:

- [DASHBOARD_OWNER_DECISION_ACCEPTANCE.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_OWNER_DECISION_ACCEPTANCE.md)

It does not implement:

- schema or migration changes
- seed changes
- API routes or handlers
- service, query, or read-model code
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
- when `threshold_rules` are absent, risk must not be inferred
- KPI-specific calculation must not be hardcoded in application code
- special formulas must come from metadata, configuration, or rule registry only

## 2. Decision Status Legend

- `proposed` = recommended in planning, waiting for owner acceptance
- `accepted` = owner-approved and ready to govern implementation planning
- `rejected` = considered and explicitly not chosen
- `needs discussion` = not ready for clean recommendation without owner conversation

## 3. Decisions Required Before Phase 1A

The following decisions should be accepted before opening:

`Phase 1A: metadata foundation + organization summary backend only`

- status inclusion and denominator rules
- overdue rule
- scope hierarchy source of truth
- ambiguous or mixed-scope ownership behavior
- `achievementStatus` enum naming
- `riskStatus` enum naming
- handling of unconfigured KPI and incomplete target metadata
- denominator metadata ownership model
- threshold rule structure direction
- minimum first-pass data quality warning set
- minimum first-pass lineage fields

The issue and annotation roll-up policy can remain narrower in Phase 1A, but a minimal policy still needs to be explicit for organization summary behavior.

Current state:

- the accepted Phase 1A baseline is now recorded in [DASHBOARD_OWNER_DECISION_ACCEPTANCE.md](D:/home/github/healthcare-kpi-hub/docs/DASHBOARD_OWNER_DECISION_ACCEPTANCE.md)
- this document remains useful as the wider option history and rationale record

## 4. Decision Topics

### 4.1 Status inclusion and denominator rules

Decision topic:

- which KPI states count in dashboard denominator and which states count as final accepted achievement inputs

Available options:

1. broad workload denominator:
   - include `draft`, `active`, `submitted`, `reviewed`, `approved`, `completed`, and overdue-labelled items
   - exclude `cancelled` and `archived`
2. execution-only denominator:
   - include `active`, `submitted`, `reviewed`, `approved`, `completed`, and overdue-labelled items
   - exclude `draft`, `cancelled`, and `archived`
3. accepted-value denominator:
   - include only final accepted states such as `approved` and `completed`
   - show the rest separately as workload

Recommended option:

- option 2

Reasoning:

- keeps dashboard totals tied to operationally active KPI population
- avoids inflating organization summary with draft-only setup records
- still preserves workload visibility without collapsing it into achievement denominator
- fits a narrow first implementation better than a very broad or very strict denominator

Impact if deferred:

- organization summary counts may be inconsistent across API, read model, and later UI
- achievement percentages may be disputed during rollout
- lineage explanations become harder because included states are not fixed

Implementation implication:

- Phase 1A should expose both:
  - included denominator statuses
  - final accepted statuses used for achievement summary
- `draft`, `cancelled`, and `archived` should remain available for warning or side-bucket display later

Owner decision status:

- `proposed`

### 4.2 Overdue rule

Decision topic:

- whether overdue is workflow-derived, date-derived, or hybrid

Available options:

1. workflow-derived only
2. date-derived only
3. hybrid:
   - derive overdue from due date crossing while item is not in final accepted state
   - optionally expose a workflow-visible overdue label later

Recommended option:

- option 3

Reasoning:

- better reflects operational reality without forcing a workflow redesign in Phase 1A
- keeps overdue explainable from source data even before workflow expansion
- avoids tying dashboard correctness to whether the operational workflow already has an explicit overdue state

Impact if deferred:

- overdue counts and warnings remain ambiguous
- owner may see mismatch between due-date reality and workflow state

Implementation implication:

- Phase 1A should treat overdue as a derived dashboard condition
- final accepted states must be fixed together with this decision

Owner decision status:

- `proposed`

### 4.3 Scope hierarchy source of truth

Decision topic:

- which source is authoritative for organization, department/workgroup, and unit/team drill-down relationships

Available options:

1. KPI assignment ownership only
2. hierarchy node table or equivalent scope model only
3. hybrid:
   - hierarchy structure comes from hierarchy scope model
   - KPI assignment attaches KPI ownership to one node in that structure

Recommended option:

- option 3

Reasoning:

- keeps the hierarchy model stable and reusable
- prevents assignment records from accidentally redefining organization structure
- fits future `role + scope + permission` direction

Impact if deferred:

- roll-up rules may differ between assignment-based and hierarchy-based reads
- drill-down paths may become inconsistent
- mixed-scope permission behavior remains hard to reason about

Implementation implication:

- Phase 1A needs one explicit scope hierarchy reference path, even if organization summary is the only exposed view at first

Owner decision status:

- `proposed`

### 4.4 Ambiguous or mixed-scope ownership behavior

Decision topic:

- how to resolve cases where KPI assignment scope and managerial scope are not identical

Available options:

1. assignment scope always wins
2. managerial scope always wins
3. hybrid least-privilege:
   - summary visibility follows authorized managerial scope
   - detail visibility and item inclusion require both hierarchy eligibility and assignment linkage where applicable
   - ambiguous cases are warned rather than silently expanded

Recommended option:

- option 3

Reasoning:

- best fit for least privilege
- prevents accidental cross-scope leakage
- keeps room for future role-model expansion without changing the core rule

Impact if deferred:

- permission boundaries remain hard to prove
- organization summary may overcount or leak KPI outside intended scope

Implementation implication:

- Phase 1A should at minimum define how ambiguous ownership is flagged in warnings and lineage

Owner decision status:

- `proposed`

### 4.5 `achievementStatus` enum naming

Decision topic:

- which enum names should represent target-rule achievement state

Available options:

1. `pass`, `fail`, `unknown`, `not_configured`
2. `achieved`, `not_achieved`, `unknown`, `not_configured`
3. `met`, `not_met`, `unknown`, `not_configured`

Recommended option:

- option 2

Reasoning:

- aligns directly with KPI achievement language
- clearer for organization summary than a generic `pass/fail`
- readable in both API and dashboard explanation contexts

Impact if deferred:

- API draft and read-model docs remain semantically right but naming remains unstable
- downstream implementation may need refactor if enum names are guessed too early

Implementation implication:

- Phase 1A should freeze one enum set before API and test planning continue

Owner decision status:

- `proposed`

### 4.6 `riskStatus` enum naming

Decision topic:

- which enum names should represent threshold-derived risk state

Available options:

1. `green`, `yellow`, `red`, `not_configured`
2. `low_risk`, `medium_risk`, `high_risk`, `not_configured`
3. `on_track`, `warning`, `critical`, `not_configured`

Recommended option:

- option 3

Reasoning:

- easier to understand in business conversation than pure traffic-light labels
- still maps cleanly to color later without hard-binding semantics to a specific palette
- avoids confusion between color and meaning when no UI exists yet

Impact if deferred:

- threshold semantics remain conceptually clear but API and warning payload naming remain unstable

Implementation implication:

- Phase 1A can still store threshold metadata generically, but API and read-model naming should not proceed without one approved enum direction

Owner decision status:

- `proposed`

### 4.7 Handling of unconfigured KPI and incomplete target metadata

Decision topic:

- how dashboard should treat KPI that lack required target metadata or other required measurement metadata

Available options:

1. exclude silently
2. include as normal with fallback assumptions
3. include in KPI population with warning and explicit `not_configured` or `unknown` semantic states
4. exclude from achievement denominator but report in a separate unconfigured bucket with warning

Recommended option:

- option 4

Reasoning:

- preserves visibility into data quality gaps
- avoids silently overstating achievement
- avoids fake precision from fallback assumptions
- matches the no-hardcode and explicit-state design direction

Impact if deferred:

- implementation may accidentally choose silent exclusion or silent fallback
- organization summary could misrepresent KPI completeness

Implementation implication:

- Phase 1A should support:
  - separate unconfigured KPI count
  - warning objects
  - explicit non-achievement state for incomplete semantics

Owner decision status:

- `proposed`

### 4.8 Denominator metadata ownership model

Decision topic:

- whether denominator metadata belongs to template-level, period-level, or hybrid ownership

Available options:

1. template-level only
2. period-level only
3. hybrid:
   - default denominator comes from definition metadata
   - period-specific value may override when the KPI semantics require it

Recommended option:

- option 3

Reasoning:

- supports common public health KPI patterns
- keeps first-pass metadata expressive without forcing every KPI into the same denominator behavior
- aligns with future import and operational-entry flexibility

Impact if deferred:

- percentage KPI planning remains incomplete
- schema and validation design cannot be finalized safely

Implementation implication:

- Phase 1A only needs to establish the ownership model and metadata contract
- period override behavior can remain narrowly implemented later if not needed immediately for organization summary

Owner decision status:

- `proposed`

### 4.9 Threshold rule structure direction

Decision topic:

- whether threshold rules should remain generic or move to typed severity bands

Available options:

1. generic free-shape rule objects
2. typed severity bands with structured ordered levels
3. hybrid:
   - typed first-pass structure for common banded risk states
   - optional extensibility preserved inside configuration later

Recommended option:

- option 3

Reasoning:

- gives first-pass dashboard enough consistency for risk classification
- avoids overly loose JSON interpretation
- still leaves room for future complexity without redesigning everything

Impact if deferred:

- schema and read-model semantics stay directionally valid but risk parsing and validation remain too open-ended

Implementation implication:

- Phase 1A should define a minimum typed structure for threshold bands even if only a few KPI use it initially

Owner decision status:

- `proposed`

### 4.10 Issue and annotation roll-up policy

Decision topic:

- what should count as rolled-up issue or annotation signal in dashboard summaries

Available options:

1. all notes roll up
2. only issue-flagged notes roll up
3. hybrid:
   - issue count comes from issue-qualified notes and warning-qualified system conditions
   - general notes do not inflate issue count

Recommended option:

- option 3

Reasoning:

- avoids noisy organization summary counts
- preserves operational visibility for meaningful issues
- works well with later warning objects and annotation summaries

Impact if deferred:

- dashboard summaries may become noisy or misleading
- organization-level issue counts may reflect note volume rather than real issues

Implementation implication:

- this can be implemented minimally in Phase 1A as:
  - issue count from issue-qualified note markers only
  - broader annotation summary deferred

Owner decision status:

- `proposed`

### 4.11 Minimum first-pass data quality warning set

Decision topic:

- which warnings must exist in Phase 1A even if broader warning taxonomy is deferred

Available options:

1. broad warning set from all planning docs
2. minimal first-pass warning set only
3. no formal minimum; decide during implementation

Recommended option:

- option 2

Reasoning:

- gives the team a tight, testable first-pass scope
- prevents warning surface from expanding too early
- still preserves the most important explainability gaps

Recommended minimum set:

- missing `measurement_type`
- missing target rule metadata
- missing `milestone_levels` for milestone KPI
- missing `threshold_rules` when risk-oriented view is requested
- invalid `aggregation_method` for `measurement_type`
- stale KPI entry data
- ambiguous scope ownership
- missing reporting period

Impact if deferred:

- first implementation may ship with inconsistent warning behavior
- support and review conversations become harder because incomplete data has no standard signal

Implementation implication:

- Phase 1A should only commit to the minimum set above
- broader warning taxonomies can be deferred

Owner decision status:

- `proposed`

### 4.12 Minimum first-pass lineage fields

Decision topic:

- which lineage fields must exist in Phase 1A even if richer traceability is deferred

Available options:

1. full lineage set from planning docs
2. minimum lineage set only
3. no formal minimum; add later

Recommended option:

- option 2

Reasoning:

- enough traceability for debugging and trust
- lighter first-pass contract
- aligns with organization-summary-first implementation

Recommended minimum set:

- `lineage_ref`
- `source_definition_refs`
- `source_entry_refs`
- `source_scope_refs`
- `reporting_period_id`
- `calculated_at`
- `aggregation_rule_version`
- `status_inclusion_version`

Impact if deferred:

- dashboard values may be hard to explain during owner review
- implementation may expose counts without traceability

Implementation implication:

- Phase 1A should treat the minimum lineage set as non-optional for organization summary responses

Owner decision status:

- `proposed`

## 5. Decisions That Can Be Deferred Without Blocking Phase 1A

The following may remain deferred if the owner accepts the recommended narrow scope:

- exact department/workgroup and unit/team drill-down response shape
- chart preference metadata usage
- chart library choice
- materialized cache strategy
- richer issue and annotation summaries beyond minimal issue-qualified roll-up
- broader warning taxonomy beyond the approved minimum set
- richer lineage fields beyond the approved minimum set
- period-level denominator override mechanics when not needed by the first organization summary slice

These should remain deferred only if they do not alter:

- Phase 1A metadata foundation
- organization summary semantics
- first-pass warning behavior
- first-pass lineage behavior

## 6. Recommended Closure Sequence

Recommended owner review order:

1. status inclusion and denominator rules
2. overdue rule
3. unconfigured KPI and incomplete metadata handling
4. scope hierarchy source of truth
5. ambiguous or mixed-scope ownership behavior
6. denominator metadata ownership model
7. threshold rule structure direction
8. `achievementStatus` enum naming
9. `riskStatus` enum naming
10. minimum warning set
11. minimum lineage set
12. issue and annotation roll-up minimum policy

## 7. Phase 1A Confirmation

This decision record keeps the same recommended first implementation phase:

`Phase 1A: metadata foundation + organization summary backend only`

This document does not open implementation.

It exists so the owner can close the decision set needed before Phase 1A may be approved.
