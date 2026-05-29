# KPI Measurement Model Requirements

**Status**: `design draft only`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Date**: `2026-05-29`

## 1. Purpose

This document captures the future KPI measurement semantics required for:

- dashboard visualization
- achievement calculation
- validation design
- drill-down explanation
- template import design
- operational KPI entry design

It exists to prevent the system from treating every KPI as the same kind of number.

This document does not implement:

- schema or migration changes
- seed changes
- API changes
- frontend changes
- dashboard UI
- aggregation SQL
- import implementation
- KPI mutation behavior changes

Related decision baseline:

- [KPI_MEASUREMENT_MODEL_DECISIONS.md](D:/home/github/healthcare-kpi-hub/docs/KPI_MEASUREMENT_MODEL_DECISIONS.md)

## 2. Why KPI Measurement Type Matters

`healthcare-kpi-hub` must not assume all KPIs behave like one generic numeric field.

Different KPI types have different:

- measurement meaning
- target rules
- achievement formulas
- aggregation rules
- visualization needs
- annotation needs

If KPI semantics are not modeled explicitly:

- dashboard cards can become misleading
- achievement percentage can be computed incorrectly
- validations can reject or accept the wrong values
- department roll-up can distort the truth
- chart choice can become arbitrary or hardcoded

## 3. Measurement Type Candidates

Future KPI definitions should support a `measurement_type` concept or equivalent metadata.

Candidate values:

- `percentage`
- `count`
- `ratio`
- `milestone`
- `boolean`
- `score`
- `currency`
- `duration`
- `custom`

These are semantic categories, not final schema values.

## 4. Target Rule Model

Each KPI should be able to express a target rule explicitly.

Candidate fields:

- `target_operator`
- `target_value`
- `target_min_value`
- `target_max_value`
- `target_direction`
- `target_rule_label`

Important concept split:

- `target_rule` = primary condition for achievement or pass/fail
- `threshold_rules` = optional condition set for risk, traffic-light, or alert display

Candidate `target_operator` values:

- `>=`
- `>`
- `<=`
- `<`
- `=`
- `between`
- `milestone_at_least`
- `milestone_exact`

Examples:

### Percentage target

- `target_operator = >=`
- `target_value = 70`
- `measurement_unit = percent`

### Milestone target

- `target_operator = milestone_at_least`
- `target_milestone_level = 3`

### Threshold examples

#### Percentage KPI

- `target_rule = percentage >= 70`
- `threshold_rules`:
  - green: `>= 70`
  - yellow: `>= 50 and < 70`
  - red: `< 50`

#### Count KPI

- `target_rule = actual_count >= 100`
- `threshold_rules`:
  - green: `>= 100`
  - yellow: `>= 80 and < 100`
  - red: `< 80`

#### Milestone KPI

- `target_rule = current_milestone_level >= 3`
- `threshold_rules` are optional and may map milestone bands to red/yellow/green if explicitly configured

#### Boolean KPI

- `target_rule = completed = true`
- `threshold_rules` are usually not needed

## 5. Numerator / Denominator Model

Percentage and ratio KPIs should support explicit numerator and denominator semantics.

Candidate concepts:

- `numerator_label`
- `denominator_label`
- `denominator_source`
- `default_denominator_value`
- `population_base_label`
- `calculation_formula_label`

Examples:

- `numerator = screened people count`
- `denominator = eligible target population`
- `formula = numerator / denominator * 100`

Important design rule:

The future system should prefer numerator/denominator roll-up where data allows.

Do not blindly average KPI percentages across departments unless the KPI definition explicitly approves that aggregation rule.

## 6. Annotation / Target Explanation

Future KPI design should separate these concepts clearly:

- `operational note`
- `target annotation`
- `issue annotation`

### Operational note

Note entered by the operator or KPI owner about current performance.

### Target annotation

Human-readable explanation of KPI target logic, success threshold, or interpretation rule.

Example:

`ต้องคัดกรองประชากรเป้าหมายให้ได้มากกว่าร้อยละ 70`

### Issue annotation

Reported issue, blocker, or operational concern affecting KPI status or interpretation.

Example:

`บุคลากรไม่เพียงพอในช่วงเดือนนี้ ทำให้การคัดกรองต่ำกว่าแผน`

Important design rule:

Target annotation is not the same as a routine operational note.

## 7. Milestone KPI Model

Some KPIs are milestone-driven rather than percentage-driven.

Future milestone KPI design should support:

- `milestone_levels`
- `current_milestone_level`
- `target_milestone_level`
- `milestone_label`
- `milestone_description`
- `achievement_condition`

Example milestone ladder:

- `Milestone 1 = ออกแบบแผน`
- `Milestone 2 = ดำเนินการบางส่วน`
- `Milestone 3 = ใช้งานจริง`
- `Milestone 4 = ประเมินผล`
- `Milestone 5 = ปรับปรุงต่อเนื่อง`

Important design rule:

Milestone KPIs should not be forced into percentage semantics when the KPI is inherently stage-based.

## 8. Dashboard Visualization Implications

Dashboard chart selection must depend on KPI semantics.

It must not be hardcoded by one route or one page only.

Visualization choice should derive from:

- `measurement_type`
- `target_direction`
- `aggregation_method`
- `reporting_period`
- `hierarchy_level`

Suggested mapping:

| Measurement type | Suitable visualization | Notes |
|---|---|---|
| `percentage` | progress bar, gauge, bullet chart | clear threshold comparison |
| `count` | scorecard, bar chart | simple workload or output volume |
| `ratio` | scorecard, trend, bullet chart | show numerator/denominator context where possible |
| `milestone` | stepper, milestone ladder, progress step card | stage progression matters more than arithmetic average |
| `boolean` | status card, pass/fail badge | binary state |
| `duration` | line chart, bar chart, threshold indicator | often threshold-sensitive |
| `currency` | scorecard, bar chart, trend | budget or cost context |
| `score` | gauge, scorecard, trend | scoring semantics may vary |

Important design rule:

Do not choose charts by visual preference alone.

## 9. Aggregation Implications

Different KPI types must aggregate differently.

### Percentage KPI

- prefer numerator/denominator roll-up when possible
- do not average percentages blindly unless explicitly allowed
- `achievementStatus` should derive from `target_rule`
- `riskStatus` should derive from `threshold_rules` only when configured

### Count KPI

- may sum if semantics and scope are compatible

### Ratio KPI

- may need numerator/denominator roll-up or other explicit calculation rule
- should not be treated as a raw average by default

### Milestone KPI

- may aggregate as milestone distribution
- may show lowest, highest, most recent, or target-achieved state
- should not average milestone levels unless explicitly approved

### Boolean KPI

- may aggregate as pass/fail count
- may aggregate as completion rate

### Duration KPI

- may need average, median, min, or max depending on KPI semantics

Conservative design reminder:

`Do not blindly average KPI percentages across departments. Prefer numerator/denominator roll-up where data allows.`

Example:

- group A = `90/100 = 90%`
- group B = `400/900 = 44.44%`
- naive average percentage = `67.22%`
- true weighted roll-up = `490/1000 = 49%`

The dashboard must avoid presenting a misleading average when numerator and denominator roll-up is available.

## 10. Template Import Implications

Future KPI template import should support KPI semantics metadata.

Expected importable metadata candidates:

- KPI code
- KPI name
- measurement type
- unit
- target operator
- target value
- target minimum or maximum value
- denominator label or source
- aggregation method
- preferred chart type
- target annotation
- milestone levels if applicable

This is a design requirement only.

It does not start import implementation.

## 11. Operational Value Entry Implications

Future operational entry design should respect KPI type.

Examples:

### Percentage KPI

- `actual_count`
- `denominator`
- `computed_percentage`
- `note`

### Milestone KPI

- `current_milestone_level`
- `milestone_note`
- `evidence_reference`

### Count KPI

- `actual_count`
- `target_count`
- `note`

### Boolean KPI

- `completed = yes/no`
- `note`

Important design rule:

Entry structure should reflect KPI semantics rather than forcing every KPI into the same raw-value shape forever.

## 12. Future Metadata Candidates

Future `KPIDefinition` or KPI template metadata may need concepts such as:

- `measurement_type`
- `measurement_unit`
- `target_operator`
- `target_value`
- `target_min_value`
- `target_max_value`
- `target_direction`
- `numerator_label`
- `denominator_label`
- `denominator_source`
- `default_denominator_value`
- `aggregation_method`
- `preferred_chart_type`
- `allowed_chart_types`
- `threshold_rules`
- `milestone_levels`
- `target_annotation`
- `calculation_formula_label`

These are requirement candidates only.

## 13. Examples

### Example: Disease Screening KPI

KPI name:

`Disease screening coverage`

Measurement type:

`percentage`

Target population / denominator:

`700 eligible people`

Numerator:

`screened people count`

Target rule:

`screened percentage >= 70%`

Target annotation:

`คัดกรองประชากรเป้าหมายให้ได้มากกว่าร้อยละ 70`

Formula:

`screened_people_count / eligible_population * 100`

Actual example:

- `screened_people_count = 500`
- `eligible_population = 700`
- `computed result = 71.43%`
- `achievement status = pass`

### Example: Milestone KPI

KPI name:

`Digital reporting maturity`

Measurement type:

`milestone`

Target rule:

`current milestone >= 3`

Target annotation:

`Milestone ระดับ 3 หมายถึง มีระบบใช้งานจริงและมีรายงานผลต่อผู้บริหารแล้ว`

## 14. Non-Goals

This design requirement does not:

- change schema or migrations
- change seed data
- implement API
- implement dashboard UI
- install chart libraries
- implement aggregation SQL
- implement import
- change frontend forms
- change KPI mutation behavior
- change RBAC
- hardcode KPI-specific calculation in code
