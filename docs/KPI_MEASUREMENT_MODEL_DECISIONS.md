# KPI Measurement Model Decisions

**Status**: `design decision draft only`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Date**: `2026-05-29`

## 1. Purpose

This document turns KPI measurement requirements into a first-pass metadata baseline for future implementation planning.

It does not implement:

- schema or migration changes
- seed changes
- API changes
- frontend changes
- dashboard UI
- chart library installation
- aggregation SQL
- import implementation
- KPI mutation behavior changes
- RBAC changes

## 2. Decision Summary

First-pass dashboard implementation should support these KPI measurement types first:

- `percentage`
- `count`
- `milestone`
- `boolean`

These KPI types are documented but deferred from first-pass implementation:

- `ratio`
- `score`
- `currency`
- `duration`
- `custom`

Reason for the first-pass baseline:

- it covers common operational KPI patterns
- it reduces risk in dashboard aggregation rules
- it makes read-model and API design simpler and safer
- it avoids prematurely modeling high-variance KPI semantics without validated metadata

## 3. First-Pass Measurement Type Support

### 3.1 First-pass required

| Measurement type | First pass? | Reason |
|---|---|---|
| `percentage` | yes | common public health KPI pattern; dashboard and achievement rely on it |
| `count` | yes | operational KPI totals and activity counts are common |
| `milestone` | yes | many transformation and maturity KPIs are stage-based |
| `boolean` | yes | simple pass/fail or yes/no compliance KPI is common |

### 3.2 Documented but deferred

| Measurement type | Defer? | Reason |
|---|---|---|
| `ratio` | yes | close to percentage but needs careful numerator/denominator semantics and display rules |
| `score` | yes | requires consistent scoring scale and interpretation rules |
| `currency` | yes | budget semantics and variance semantics need additional design |
| `duration` | yes | average/median/min/max decisions need more domain-specific policy |
| `custom` | yes | should not enter first implementation without explicit metadata and rule approval |

## 4. Metadata Decision Matrix

| Metadata | Decision | Reason |
|---|---|---|
| `measurement_type` | must-have | dashboard, validation direction, and chart choice depend on it |
| `measurement_unit` | must-have | display and interpretation depend on it |
| `target_operator` | must-have | achievement condition depends on it |
| `target_value` | must-have | threshold comparison depends on it |
| `target_direction` | must-have | higher/lower/range logic depends on it |
| `target_annotation` | must-have | human explanation of target rule is required |
| `aggregation_method` | must-have | dashboard roll-up depends on it |
| `numerator_label` | should-have | useful for percentage explanation and API transparency |
| `denominator_label` | should-have | useful for percentage explanation and API transparency |
| `denominator_source` | should-have | clarifies where denominator comes from |
| `default_denominator_value` | should-have | useful when denominator is template-defined |
| `calculation_formula_label` | should-have | improves explainability |
| `preferred_chart_type` | should-have | can guide first-pass UI without hardcoding |
| `threshold_rules` | should-have | useful for risk and traffic-light interpretation |
| `milestone_levels` | must-have for milestone | milestone KPI cannot work without ordered level metadata |
| `target_min_value` | later | needed when range targets are introduced |
| `target_max_value` | later | needed when range targets are introduced |
| `allowed_chart_types` | later | nice to have after first-pass visualization stabilizes |
| `display_precision` or `decimal_places` | later | useful but not first-pass critical |
| KPI-specific code-path formula in application code | not now | violates metadata-driven design direction |

## 5. Percentage KPI Baseline

### 5.1 Decision

Percentage KPI should preserve numerator and denominator semantics.

### 5.2 Baseline rules

- percentage KPI requires numerator and denominator concepts
- denominator may be fixed from template metadata
- denominator may also need to be entered or confirmed per reporting period in the future
- denominator override policy remains open, but should not be freely hardcoded or implicit
- dashboard roll-up should prefer numerator/denominator aggregation
- averaging percentages blindly is not acceptable by default

### 5.3 Display rule

Computed percentage should be displayable alongside numerator and denominator context when useful.

Preferred explanation pattern:

- numerator
- denominator
- computed percentage
- target rule
- achievement result

### 5.4 Storage direction for future design

For future entry-model planning, percentage KPI should preserve both:

- numerator-like operational value
- computed percentage for display or read-model use

Do not assume one generic `actual_value` string is sufficient forever for all KPI semantics.

## 6. Milestone KPI Baseline

### 6.1 Decision

Milestone KPI requires ordered milestone levels.

### 6.2 Baseline rules

- milestone should have both ordered numeric level and human-readable label
- milestone may also carry a description for each level
- milestone KPI can have a `target_milestone_level`
- achievement passes when `current_milestone_level >= target_milestone_level`
- dashboard may visualize milestone progress with a stepper, ladder, or progress-step summary

### 6.3 Important constraint

Do not average milestone levels blindly across hierarchy levels.

Preferred first-pass aggregation direction:

- distribution by milestone level
- lowest achieved level
- highest achieved level
- count at or above target

## 7. Annotation Model Decision

### 7.1 Target annotation

Belongs to KPI definition or KPI template.

Purpose:

- explain target rule
- explain threshold meaning
- explain how success is interpreted

### 7.2 Operational note

Belongs to KPI entry or KPI value record.

Purpose:

- explain actual operational context for the current reporting period

### 7.3 Issue annotation

Should be treated separately from target annotation.

First-pass design direction:

- issue annotation may live with KPI entry or KPI value context
- future issue-tracking abstraction may evolve later if needed

## 8. Aggregation Rule Baseline By KPI Type

| Measurement type | Aggregation rule candidate |
|---|---|
| `percentage` | roll up numerator/denominator where possible |
| `count` | sum if semantic and scope compatibility hold |
| `milestone` | distribution by level, not blind average |
| `boolean` | pass/fail count or completion rate |
| `ratio` | defer first-pass; require explicit numerator/denominator or approved formula |
| `duration` | defer first-pass; average/median/min/max depends on KPI semantics |
| `currency` | defer first-pass; sum or variance depends on budget semantics |
| `score` | defer first-pass; average only if scale consistency is explicitly approved |

Important rule:

`Do not blindly average KPI percentages or milestone levels.`

## 9. Dashboard Read Model Implication

Future dashboard read model should expose semantic fields such as:

- `measurementType`
- `displayUnit`
- `targetRule`
- `targetAnnotation`
- `computedValue`
- `achievementStatus`
- `numerator`
- `denominator`
- `aggregationMethod`
- `dataQualityWarnings`
- `lineageMeta`

These fields are conceptual read-model outputs, not implementation commitments yet.

## 10. Import / Template Implication

Future KPI template import should support the first-pass metadata baseline.

Expected minimum importable metadata for first-pass KPI types:

- KPI code
- KPI name
- `measurement_type`
- `measurement_unit`
- `target_operator`
- `target_value`
- `target_direction`
- `aggregation_method`
- `target_annotation`
- `milestone_levels` where applicable

Should-have import metadata:

- `numerator_label`
- `denominator_label`
- `denominator_source`
- `default_denominator_value`
- `preferred_chart_type`
- `calculation_formula_label`

## 11. Remaining Open Questions

- should denominator override be allowed per period, and if yes under which authority?
- should percentage KPI expose both raw numerator and computed percentage at the API level by default?
- should boolean KPI support tri-state conditions later, such as yes/no/not-applicable?
- should milestone levels be stored as numeric order with separate label list, or as structured objects only?
- when `ratio` is added, should it be treated separately from `percentage` in first-pass API shape or share the same semantic envelope?
- should threshold rules be first-pass mandatory for traffic-light display, or can they remain optional in initial rollout?

## 12. Explicit Non-Goals

This decision document does not:

- approve schema fields yet
- approve migration changes yet
- approve import implementation yet
- approve entry form redesign yet
- approve KPI mutation redesign yet
- approve API implementation yet
- approve dashboard UI implementation yet

## 13. Configuration Rule

No KPI-specific calculation should be hardcoded in application code.

If future implementation needs specialized rules, they must come from explicit metadata, configuration, or a separately managed rule registry rather than hidden one-off conditionals in UI or API code.
