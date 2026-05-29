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

## 5. Organization-First Landing Requirement

Owner-led rehearsal and product review confirmed an important future requirement:

- after login, the default landing experience should begin at an `Organization KPI Dashboard`
- the system should not drop users directly into a unit or team KPI page as the primary first screen
- the future dashboard must provide organization-wide KPI overview before drill-down into lower hierarchy levels

Expected future landing content:

- total KPIs
- completed KPIs
- pending KPIs
- at-risk KPIs
- overdue KPIs
- overall achievement percentage
- current reporting period
- issue, note, or annotation summary
- summary cards and charts aligned to KPI semantics

Required future drill-down path:

`Organization -> Department / Workgroup -> Unit / Team -> Individual KPI detail`

This hierarchy-first navigation model must preserve lineage back to:

- `KPIDefinition`
- `KPIEntry`
- `EntryValue`
- `ReportingPeriod`
- hierarchy node and owner scope
- audit history where relevant

The future dashboard must support overview first, then drill-down inspection, then mutation only where workflow state and permission allow.

## 6. Future Dashboard Levels

### 6.1 Organization dashboard

Default future landing page after login:

- hospital or organization KPI overview
- KPI summary cards
- progress overview
- status distribution
- risk or overdue summary
- department ranking or department summary
- trend view if period history exists

### 6.2 Department or workgroup summary

From the organization dashboard, users should drill down into groups such as:

- `Public Health`
- `Digital Health Division`
- `Nursing Division`

Each summary should show:

- total KPIs in scope
- completed, pending, and at-risk counts
- achievement percentage
- child units or teams
- top issues and drill-down links

### 6.3 Unit or team summary

This level connects the future dashboard flow to pages similar to the current KPI page UI.

Each unit or team summary should show:

- hierarchy context
- assigned KPI items
- KPI status
- actual, target, and progress summary
- owner
- due date
- audit or history access
- drill-down to individual level where available

### 6.4 Individual KPI detail

This level should support:

- KPI entry detail
- actual, progress, and note review or mutation if allowed
- status review
- audit history
- note and annotation review
- stale-write, locked-entry, and invalid-value behavior

## 7. KPI-To-Chart Mapping

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

## 8. Future Dashboard Metadata

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

## 9. Dashboard Lineage Rule

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

## 10. Dashboard Decision Questions Before Implementation

Before any dashboard implementation begins, the team must decide:

- which KPI statuses are eligible for dashboard inclusion
- how `draft`, `pending`, `submitted`, and `locked` should be counted
- how missing values should be handled
- how stale or rejected values should be handled
- how aggregation by reporting period should behave
- how aggregation by organization hierarchy should behave
- how drill-down should respect permission boundaries
- how dashboard data quality warnings should be displayed
- how annotation, note, and issue summaries should roll up by hierarchy level
- whether the default landing page should vary by role and scope

## 11. Role-Aware Landing And Scope Behavior

Future dashboard landing should be role-aware and scope-aware.

Examples for future design:

- `executive`: default landing page is organization-wide dashboard
- `department_manager`: default landing page may be organization dashboard filtered to department scope, or a department dashboard
- `unit_manager`: default landing page may be unit or team dashboard
- `staff_editor` or `editor`: default landing may emphasize assigned KPI worklist, but still allow dashboard visibility where permission allows
- `viewer`: can view dashboards within assigned scope but cannot mutate KPI data
- `system_admin`: may access system administration functions, but should not automatically become business approver or executive dashboard owner

## 12. Future Design Phase

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
- define organization-first landing behavior
- define annotation and issue roll-up rules
- define role-aware landing defaults without bypassing workflow or permission controls

## 13. Explicit Non-Goals For This Requirement Capture

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
- change default landing page behavior in the current implementation

## 14. Pilot Scope Reminder

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
- `organization-first dashboard landing page with hierarchical drill-down`

It is not a defect in the current pilot scope.
