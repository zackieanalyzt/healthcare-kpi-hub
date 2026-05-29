# Dashboard API Contract Draft

**Status**: `draft only, not an implementation commitment`
**Phase**: `Dashboard and KPI Visualization Design Phase`
**Date**: `2026-05-29`

## 1. Purpose

This document proposes future API contract shapes for dashboard behavior.

It does not implement:

- actual routes
- controllers
- handlers
- read-model services
- aggregation queries

## 2. Contract Principles

Future dashboard API must be:

- scope-aware
- permission-aware
- period-aware
- lineage-aware
- hierarchy-aware
- metadata-driven

It must not rely on hardcoded role-page routing or hardcoded hierarchy labels.

## 3. Endpoint Candidates

Possible endpoint families:

### Option A: explicit hierarchy endpoints

- `GET /api/dashboard/organization`
- `GET /api/dashboard/hierarchy/:nodeId`
- `GET /api/dashboard/kpi/:entryId`

### Option B: scope-driven summary endpoint

- `GET /api/dashboard/summary?scope=organization&period=...`
- `GET /api/dashboard/summary?scope=department&nodeId=...&period=...`
- `GET /api/dashboard/summary?scope=unit&nodeId=...&period=...`

### Option C: mixed summary plus detail endpoints

- `GET /api/dashboard/summary`
- `GET /api/dashboard/hierarchy/:nodeId`
- `GET /api/dashboard/kpi-items`
- `GET /api/dashboard/kpi/:entryId`

Current design preference:

- use a scope-driven summary contract for top-level summary
- use hierarchy node identifiers for drill-down
- link back to existing KPI detail routes for individual inspection

## 4. Common Response Shape

Common response concepts may include:

- `period`
- `scope`
- `summaryCards`
- `statusDistribution`
- `riskSummary`
- `hierarchyChildren`
- `kpiItems`
- `annotations`
- `drilldownLinks`
- `dataQualityWarnings`
- `lineageMeta`

## 5. Organization Summary Draft

Example concept:

```json
{
  "period": {
    "id": "rpt_2026_05",
    "key": "2026-05",
    "status": "open"
  },
  "scope": {
    "level": "organization",
    "nodeId": null,
    "label": "organization"
  },
  "summaryCards": [
    { "code": "total_kpis", "label": "Total KPIs", "value": 0 },
    { "code": "completed_kpis", "label": "Completed", "value": 0 },
    { "code": "pending_kpis", "label": "Pending", "value": 0 },
    { "code": "at_risk_kpis", "label": "At Risk", "value": 0 },
    { "code": "overdue_kpis", "label": "Overdue", "value": 0 },
    { "code": "achievement_rate", "label": "Achievement %", "value": 0 }
  ],
  "statusDistribution": [],
  "riskSummary": [],
  "hierarchyChildren": [],
  "annotations": [],
  "dataQualityWarnings": [],
  "lineageMeta": {
    "includedStatuses": [],
    "aggregationRuleSet": "draft"
  }
}
```

The field names above are illustrative only.

## 6. Department / Workgroup Summary Draft

Expected concepts:

- period context
- scope node
- KPI counts
- status distribution
- achievement percentage
- risk and overdue summaries
- child unit or team list
- issue and annotation summary
- drill-down links

## 7. Unit / Team Summary Draft

Expected concepts:

- hierarchy context
- KPI item list
- owner
- due context
- actual vs target summary
- progress summary
- links to KPI entry detail
- audit availability indicator

## 8. KPI Detail Draft

For individual drill-down, preferred direction is to reuse or align with the existing KPI entry detail model where possible instead of inventing an unrelated dashboard detail contract.

Possible pattern:

- dashboard summary response includes `entryId`
- client links to existing KPI detail read route
- future dashboard API may include lightweight wrapper metadata, but should not duplicate detail logic without a reason

## 9. Permission And Scope Constraints

Explicit design rule:

`Dashboard drill-down must not reveal KPI entries outside user authorization scope.`

The API contract must support:

- read-only dashboard access for `viewer` within scope
- dashboard plus worklist visibility for `editor` within scope
- scope-relevant managerial visibility for `manager`-like future roles
- separation between `system_admin` and business executive scope
- future `role + scope + permission` filtering

Scope resolution must be driven by authorization context, not by hardcoded username rules.

## 10. Data Quality And Warnings

The API contract should allow warnings such as:

- missing value
- overdue workload
- excluded KPI due to unresolved state
- no reporting period
- incomplete lineage or incomplete summary source

Warnings should be structured data, not only human-readable strings.

## 11. Non-Goals

This draft does not commit to:

- route names as final
- response field names as final
- pagination shape as final
- SQL strategy
- caching strategy
- materialized-view strategy

## 12. Acceptance Criteria

This draft is sufficient when it:

- proposes candidate endpoint families
- proposes summary response concepts
- explains drill-down linking strategy
- states permission and scope constraints
- avoids hardcoded route logic and role assumptions
- remains clearly separated from implementation work
