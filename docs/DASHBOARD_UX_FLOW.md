# Dashboard UX Flow

**Status**: `design draft only`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Date**: `2026-05-29`

## 1. UX Goal

Future UX should move from:

`navigation opens deep KPI pages first`

to:

`overview first -> drill-down by hierarchy -> inspect KPI detail -> mutate only when allowed`

## 2. Persona And Landing Behavior

Current pilot roles remain:

- `viewer`
- `editor`
- `manager`
- `admin`

Future hospital role/scope behavior is not implemented yet, but dashboard UX should be designed for it now.

| User type | Expected landing | Notes |
|---|---|---|
| `executive` | organization-wide dashboard | highest-level business overview |
| `department_manager` | department/workgroup dashboard or organization dashboard filtered by scope | scope-aware, not hospital-wide by default |
| `unit_manager` | unit/team dashboard | focused on operational unit performance |
| `staff_editor` / `editor` | assigned KPI worklist plus dashboard visibility if allowed | workload-first but still dashboard-aware |
| `viewer` | read-only dashboard within assigned scope | no mutation |
| `system_admin` | system/admin tools, not automatic business approver | admin role is distinct from executive dashboard role |

## 3. Hierarchy Drill-Down Flow

Target future navigation:

`Organization Dashboard -> Department / Workgroup Summary -> Unit / Team Summary -> Individual KPI Detail`

This flow must be driven by hierarchy and scope metadata, not hardcoded page lists.

## 4. Organization Dashboard

Organization level should show:

- total KPI count
- completed count
- submitted count
- locked count
- pending count
- draft count
- at-risk count
- overdue count
- overall achievement percentage
- current reporting period
- department or workgroup comparison
- annotation, issue, or note summary
- drill-down links to department or workgroup scope

Suggested UX composition:

- summary cards first
- status and risk summaries second
- hierarchy comparison third
- issue or annotation panel alongside actionable drill-down links

## 5. Department / Workgroup Summary

Department level should show:

- KPI count within scope
- status distribution
- achievement percentage
- risk and overdue indicators
- child units or teams
- top issues and annotation summary
- drill-down links to unit or team level

Department UX should support comparison without forcing the user to inspect raw entry details first.

## 6. Unit / Team Summary

Unit or team level should show:

- hierarchy context
- assigned KPI items
- actual vs target summary
- progress value
- workflow status
- owner
- due date
- audit or history access
- drill-down to individual KPI entry detail

This level can remain structurally close to the current KPI page concept, but it should be entered from dashboard summary flow rather than serving as the default future first screen.

## 7. Individual KPI Detail

Individual detail should show or link to:

- KPI code and KPI name
- reporting period
- actual value
- progress value
- note
- workflow status
- audit history
- edit controls only if permission and workflow allow
- stale-write, locked-entry, and validation behavior

This level should remain the point where mutation is performed, not the summary dashboard itself.

## 8. UX Constraints

### 8.1 Read-Only State

Read-only users should see explicit read-only indicators.

### 8.2 Role Differentiation

Feedback `FB-001` showed current role-specific UI differentiation is unclear.

Future UX should improve differentiation through:

- clearer read-only states
- clearer action availability
- clearer scope labels
- clearer dashboard context per persona

### 8.3 Card-To-Action Linking

Dashboard summary cards should link to actionable filtered lower-level views.

Examples:

- overdue count -> overdue KPI list in current scope
- at-risk count -> at-risk KPI list
- department card -> department summary
- KPI item -> KPI entry detail

### 8.4 No Hardcode

UX flow must not depend on:

- hardcoded usernames
- hardcoded hospital structure labels
- hardcoded role-to-page mappings
- hardcoded dashboard sections by one-off rules

Future UX should resolve landing and drill-down from configuration, scope, and hierarchy metadata.

## 9. Non-Goals For This UX Draft

This document does not:

- change current routes
- change current landing behavior
- change left navigation behavior now
- implement dashboard UI
- install chart components

## 10. UX Acceptance Criteria

This UX design is sufficient when:

- organization-first landing behavior is defined
- department, unit, and individual drill-down flow is clear
- read-only and mutation boundaries are explicit
- feedback `FB-001` and `FB-002` are reflected
- no hardcoded dashboard behavior is assumed
