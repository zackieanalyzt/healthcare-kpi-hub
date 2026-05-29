# Dashboard Visualization Requirements

**Status**: `captured as a gated future capability`
**Current checkpoint**: `9da19ff docs: align pilot rehearsal logistics`
**Previous pilot package checkpoint**: `82fc153 docs: harden controlled pilot rehearsal package`
**Date**: `2026-05-29`

## 1. Product Position

`healthcare-kpi-hub` is both:

1. an operational KPI management system
2. a KPI dashboard and visualization platform

Dashboard is not decorative UI. It is a core future product capability. The system must support not only operational KPI workflow management, but also KPI visualization that helps users interpret performance clearly across time, targets, teams, and hierarchy levels.

## 2. Gating Rule

Dashboard implementation is deferred until controlled pilot rehearsal results and feedback triage are recorded.

Current sequence:

`controlled pilot rehearsal -> feedback triage -> scope decision -> dashboard design and implementation consideration`

This commit captures product requirements only. It does not implement dashboard UI, dashboard API, aggregation services, chart libraries, or dashboard schema changes.

## 3. Core Concept

`KPI Management Workflow != Dashboard Visualization`

They are different responsibilities:

- KPI management workflow handles entry lifecycle, validation, mutation, concurrency, and audit
- dashboard visualization handles derived read models, aggregation, filtering, comparison, and visual interpretation

These two areas must still connect through a traceable read model or aggregation model with preserved lineage.

## 4. Requirement Summary

`healthcare-kpi-hub` must support KPI-related dashboard visualization.

The system must not only store and manage KPI operational records, but also provide dashboard views using appropriate chart types based on KPI semantics, reporting period, target type, hierarchy level, ownership context, and comparison needs.

Dashboard values must preserve lineage back to `KPIDefinition`, `KPIEntry`, `EntryValue`, `ReportingPeriod`, and organization hierarchy.

Dashboard and aggregation logic must not bypass workflow status, validation, permission, audit, or data quality rules.

## 5. KPI-To-Chart Mapping

Chart selection must follow KPI semantics, not visual preference alone.

| KPI characteristic | Suitable visualization |
|---|---|
| actual vs target | bullet chart, gauge, progress bar |
| time trend | line chart, area chart |
| unit or department comparison | bar chart, grouped bar, horizontal bar |
| status distribution | stacked bar, donut chart with caution |
| achievement rate | progress bar, gauge, scorecard |
| risk, late, or overdue | alert cards, status table, heatmap |
| multiple KPIs in a group | scorecard grid, matrix, heatmap |
| actual vs target over multiple periods | combo chart, line with target reference |
| ranking | horizontal bar |
| hierarchy performance | drill-down table or tree plus chart |

Pie and donut charts should be used carefully:

- avoid them when there are many categories
- avoid them when users need precise comparison between close values
- prefer bars, scorecards, or tables when interpretability matters more than visual compactness

## 6. Future Dashboard Metadata

In a future dashboard design phase, `KPIDefinition` may require dashboard-oriented metadata such as:

- `preferred_chart_type`
- `allowed_chart_types`
- `aggregation_method`
- `target_direction`
- `display_unit`
- `decimal_places`
- `threshold_rules`
- `traffic_light_rules`
- `dashboard_group`
- `dashboard_order`
- `drilldown_enabled`

Possible `target_direction` values:

- `higher_is_better`
- `lower_is_better`
- `range_is_best`
- `target_match`

Possible `aggregation_method` values:

- `latest`
- `sum`
- `average`
- `weighted_average`
- `min`
- `max`
- `count`
- `ratio`
- `custom`

These are requirement candidates only. They are not approved schema changes in this commit.

## 7. Dashboard Lineage Rule

Every dashboard card, chart, or derived table must be able to answer:

- which KPI definition produced this result
- which KPI entries were included
- which reporting periods were included
- which owner or hierarchy node was used
- which aggregation rule was applied
- which workflow statuses were counted, such as `draft`, `pending`, `submitted`, or `locked`
- whether any data quality warning exists
- whether the user can drill down to KPI entry detail

Dashboard outputs must remain explainable and auditable.

## 8. Dashboard Decision Questions Before Implementation

Before any dashboard implementation begins, the team must decide:

- which KPI statuses are eligible for dashboard inclusion
- how `draft`, `pending`, `submitted`, and `locked` should be counted
- how missing values should be handled
- how stale or rejected values should be handled
- how aggregation by reporting period should behave
- how aggregation by organization hierarchy should behave
- how drill-down should respect permission boundaries
- how dashboard data quality warnings should be displayed

## 9. Future Design Phase

Suggested future phase:

- `Dashboard and KPI Visualization Design Phase`

This phase should happen only after pilot feedback triage.

Expected future scope:

- define dashboard personas
- define KPI-to-chart mapping rules
- define dashboard metadata on KPI definitions
- define aggregation rules
- define status inclusion rules
- define hierarchy filter and drill-down behavior
- define dashboard read model
- define chart specification contract
- define dashboard API contract
- prototype a read-only dashboard
- ensure drill-down links back to KPI entry detail

## 10. Explicit Non-Goals For This Requirement Capture

This commit does not:

- implement dashboard UI
- add a chart library
- implement dashboard API
- add dashboard migrations
- add aggregation services
- change KPI schema
- change seed data for dashboard
- change permission model
- change navigation to add dashboard screens
- implement import workflow
- implement assignment or due-date workflow
- start the advanced permission model

## 11. Pilot Scope Reminder

Current controlled pilot rehearsal still tests only the conservative KPI workflow:

- login and logout
- role behavior
- navigation and worklist
- KPI page
- KPI entry detail
- approved field mutation
- status transition
- stale-write handling
- locked entry behavior
- invalid value rejection
- audit history
- Thai and English message review

If testers ask for dashboard capability during this phase, capture it as:

- `S4 observation`
- `future request`

It is not a defect in the current pilot scope.
