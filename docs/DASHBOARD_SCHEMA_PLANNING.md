# Dashboard Schema Planning

**Status**: `schema planning only`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Checkpoint baseline**: `6746633 docs: plan dashboard implementation strategy`
**Date**: `2026-05-30`

## 1. Purpose

This document plans schema and metadata placement for first-pass dashboard KPI semantics only.

It does not implement:

- schema or migration changes
- seed changes
- API routes
- dashboard UI
- chart library installation
- aggregation SQL
- import implementation
- frontend form changes
- KPI mutation behavior changes
- RBAC changes

## 2. Approved Metadata Baseline

First-pass must-have metadata:

- `measurement_type`
- `measurement_unit`
- `target_operator`
- `target_value`
- `target_direction`
- `target_annotation`
- `aggregation_method`

Optional or should-have metadata:

- `threshold_rules`
- `numerator_label`
- `denominator_label`
- `denominator_source`
- `default_denominator_value`
- `calculation_formula_label`
- `preferred_chart_type`

Milestone-only metadata:

- `milestone_levels`

Supporting rules already approved for planning:

- `target_rule` drives pass/fail or achievement condition
- `threshold_rules` drive optional risk or traffic-light classification
- `achievementStatus` derives from `target_rule`
- `riskStatus` derives from `threshold_rules` only when configured
- no KPI-specific calculation may be hardcoded in app code

## 3. Schema Placement Options

### Option A: explicit columns on `KPIDefinition`

Pros:

- strong validation clarity
- simple queryability for core dashboard fields
- easier auditability of stable metadata
- predictable support for read-model filters

Cons:

- high migration complexity as semantics expand
- weaker fit for structured metadata such as threshold bands or milestone ladders
- risks schema bloat
- less flexible for future import variation

### Option B: JSON config on `KPIDefinition`

Pros:

- high future extensibility
- good fit for structured threshold and milestone metadata
- lower immediate schema expansion
- flexible for import payload evolution

Cons:

- weaker validation clarity by default
- harder queryability for dashboard reads
- weaker auditability if shape control is loose
- higher risk of violating no-hardcode principle through ad hoc JSON interpretations

### Option C: hybrid explicit columns + JSON config

Pros:

- best balance between validation clarity and extensibility
- strong queryability for first-pass core metadata
- structured optional semantics can remain flexible
- good fit for dashboard read-model support
- aligns with import compatibility while keeping stable core fields explicit
- supports no-hardcode principle with a disciplined metadata contract

Cons:

- boundary between explicit and JSON fields must be governed carefully
- migration planning is more nuanced than a pure single-model approach
- can become messy if ownership of each field is not documented

### Option D: separate KPI measurement metadata table

Pros:

- clean separation of semantics from general KPI definition fields
- potentially better normalization and extensibility
- could align well with future template lifecycle

Cons:

- more joins and more implementation complexity
- higher migration and operational overhead for first-pass dashboard work
- may be premature before template management and import lifecycle are implemented
- increases cognitive load for read-model and audit linkage

## 4. Recommended Direction

Recommended direction:

`Option C: hybrid explicit columns + JSON config`

Recommended interpretation:

- explicit columns for stable, first-pass core metadata
- JSON or structured config for optional, nested, or future-extensible semantics

Rationale:

- the first dashboard implementation needs strong filtering and validation on a stable set of KPI semantics
- threshold bands and milestone ladders are structured data and should not be forced into many one-off columns
- denominator and chart-preference details may evolve and benefit from structured configuration
- this preserves a clean path toward import support and future metadata growth
- it is the safest option for honoring the no-hardcode principle without overcommitting to a highly normalized model too early

Separate table decision:

- not recommended for first-pass dashboard implementation
- may be revisited later if KPI template lifecycle becomes more formalized

## 5. Draft Field Placement

| Metadata | Placement | Reason |
|---|---|---|
| `measurement_type` | explicit column | required for validation, read model, and chart behavior |
| `measurement_unit` | explicit column | required for display and interpretation |
| `target_operator` | explicit column | required for achievement rule |
| `target_value` | explicit column | required for primary comparison |
| `target_direction` | explicit column | required for higher/lower/range logic |
| `target_annotation` | explicit text column | human explanation should be directly readable |
| `aggregation_method` | explicit column | dashboard roll-up depends on it |
| `threshold_rules` | JSON/config | optional structured risk classification |
| `milestone_levels` | JSON/config | milestone-only structured ladder data |
| `numerator_label` | JSON/config or explicit | explainability field; first-pass can stay in config |
| `denominator_label` | JSON/config or explicit | explainability field; first-pass can stay in config |
| `denominator_source` | JSON/config | semantics may evolve by KPI type |
| `default_denominator_value` | JSON/config or explicit numeric | needs further decision around template-vs-period behavior |
| `calculation_formula_label` | JSON/config | explainability field, not core filtering field |
| `preferred_chart_type` | JSON/config | advisory visualization metadata |

Practical first-pass split:

- explicit:
  - `measurement_type`
  - `measurement_unit`
  - `target_operator`
  - `target_value`
  - `target_direction`
  - `target_annotation`
  - `aggregation_method`
- config:
  - `threshold_rules`
  - `milestone_levels`
  - denominator-related metadata
  - explainability helpers
  - chart preference metadata

## 6. Validation Planning

Future validation rules should include:

- `measurement_type` must be one of the approved first-pass supported types
- percentage KPI requires `target_operator`, `target_value`, and `target_direction`
- milestone KPI requires `milestone_levels`
- boolean KPI should not require numeric `threshold_rules`
- `threshold_rules` must remain optional and must not be required for every KPI
- `riskStatus` must not be inferred when `threshold_rules` are missing
- aggregation method must be valid for the chosen `measurement_type`
- metadata shape must remain rule-driven and must not rely on KPI-specific hardcoded calculation branches

Validation implication of hybrid model:

- explicit fields can be validated strongly at schema and service boundaries
- JSON/config fields require schema-shape validation at the application layer or config validation layer later

## 7. Migration Risk Planning

Key future migration risks:

- existing `KPIDefinition` rows will need default or backfilled metadata
- seed and sample data will need aligned metadata later
- backward compatibility with current KPI page reads must be preserved
- current KPI mutation flow must remain unchanged
- dashboard metadata additions must not break current tests
- rollback strategy is needed if future migration introduces incompatible defaults

Planning guardrails:

- treat missing metadata as a migration-planning problem, not a reason to hardcode fallback KPI logic
- separate schema introduction from dashboard UI rollout
- keep read-model logic tolerant of explicit `not_configured` states during early rollout

## 8. Import Compatibility

Future KPI template import should support at least:

- KPI code
- KPI name
- `measurement_type`
- `measurement_unit`
- `target_operator`
- `target_value`
- `target_direction`
- `aggregation_method`
- `target_annotation`
- optional `threshold_rules`
- `milestone_levels` if applicable

Import is not implemented in this phase.

Planning implication:

- schema placement should not make future import mapping awkward
- first-pass explicit fields should map naturally from tabular import columns
- structured config fields should have a documented import representation later

## 9. Open Questions

- should denominator be template-level, period-level, or hybrid?
- should `target_value` support numeric, string, boolean, and milestone target forms in one field family or split structures later?
- should `target_annotation` be required for every KPI?
- should `threshold_rules` JSON shape remain generic or become typed?
- should `milestone_levels` use an array of ordered objects?
- should `preferred_chart_type` be stored now or derived later from semantics?

These remain planning questions and should be resolved before schema execution approval.

## 10. Recommended Next Step

Recommended next step:

`read-model planning only`

Reason:

- schema placement is now narrowed enough to support read-model planning
- the remaining open questions are important, but they do not block conceptual read-model design
- implementation should still stay gated until later explicit approval

## 11. Explicit Non-Goals

This document does not approve:

- schema or migration execution
- seed changes
- API route implementation
- dashboard UI implementation
- chart library installation
- aggregation SQL implementation
- import implementation
- frontend form changes
- KPI entry mutation behavior changes
- RBAC changes
- hardcoded KPI-specific calculation
