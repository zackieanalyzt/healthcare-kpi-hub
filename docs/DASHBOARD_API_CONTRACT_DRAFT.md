# Dashboard API Contract Draft

**Status**: `Phase 1A.1 contract stabilization baseline`
**Phase**: `Phase 1A.1 API Contract Stabilization`
**Date**: `2026-05-30`

## 1. Purpose

This document records the stabilized Phase 1A organization summary API
contract and keeps future dashboard contract ideas separated from the active
backend-only implementation.

Implemented Phase 1A endpoint:

- `GET /api/dashboard/summary?scope=organization`

Still not implemented in Phase 1A.1:

- dashboard UI
- drill-down UI or drill-down endpoints
- chart payloads or chart library integration
- materialized cache
- department, workgroup, unit, team, or individual dashboard detail endpoints
- import, RBAC, KPI mutation, or advanced aggregation changes

## 2. Contract Principles

Future dashboard API must be:

- scope-aware
- permission-aware
- period-aware
- lineage-aware
- hierarchy-aware
- metadata-driven
- KPI-semantics-aware

It must not rely on hardcoded role-page routing or hardcoded hierarchy labels.

## 3. Phase 1A Stable Endpoint

Phase 1A exposes exactly one dashboard API endpoint:

```text
GET /api/dashboard/summary?scope=organization
```

Request behavior:

- `scope=organization` is the only supported scope in Phase 1A.
- missing `scope` defaults to organization.
- unsupported scopes return a validation error rather than silently falling
  back to another scope.
- the endpoint is read-only.
- the endpoint requires dashboard read permission through the existing auth
  and RBAC path.

Response field naming:

- Phase 1A uses existing backend JSON naming style with `snake_case` fields.
- The contract is intentionally stable for frontend consumption, even though
  future dashboard levels may add new fields later.

### 3.1 Phase 1A Response Shape

Stable response body under the existing API success envelope:

```json
{
  "success": true,
  "data": {
    "meta": {
      "contract_version": "phase-1a",
      "release_label": "phase-1a-kickoff",
      "phase_label": "Phase 1A",
      "generated_at": "2026-05-30T00:00:00.000Z"
    },
    "scope": {
      "type": "organization",
      "id": "pag_org_hospital",
      "name": "Hospital Organization"
    },
    "period": {
      "id": "rpt_2026_05",
      "key": "2026-05",
      "status": "open"
    },
    "summary_cards": [
      { "code": "total_kpis", "label": "Total KPIs", "value": 0 },
      { "code": "completed_kpis", "label": "Completed", "value": 0 },
      { "code": "pending_kpis", "label": "Pending", "value": 0 },
      { "code": "overdue_kpis", "label": "Overdue", "value": 0 },
      { "code": "at_risk_kpis", "label": "At Risk", "value": 0 },
      { "code": "achievement_rate", "label": "Achievement %", "value": 0 }
    ],
    "achievement": {
      "numerator": 0,
      "denominator": 0,
      "percent": 0
    },
    "warnings": [],
    "lineage": []
  }
}
```

Stable warning item shape:

```json
{
  "code": "missing_threshold_rules",
  "message": "KPI threshold rules are missing.",
  "kpi_definition_id": "kpd_example",
  "kpi_entry_id": "ent_example"
}
```

Stable lineage item shape:

```json
{
  "kpi_definition_id": "kpd_example",
  "assignment_id": "ent_example",
  "scope_type": "organization",
  "scope_id": "pag_org_hospital",
  "measurement_metadata_version_or_updated_at": "2026-05-30T00:00:00.000Z",
  "calculation_timestamp": "2026-05-30T00:00:00.000Z",
  "source_entry_updated_at": "2026-05-30T00:00:00.000Z"
}
```

Empty-state behavior:

- if no operational KPI is included in the organization denominator, the API
  returns the same shape with zero-valued summary cards, achievement
  numerator/denominator/percent set to `0`, and empty warning and lineage
  arrays unless separate data-quality warnings exist.

Incomplete metadata behavior:

- incomplete metadata must not crash the API.
- included operational KPI records remain in `total_kpis`.
- achievement percent numerator excludes unconfigured KPI.
- warnings identify missing or invalid metadata.
- missing `threshold_rules` produces an explicit warning and does not infer
  risk.

## 4. Future Endpoint Candidates

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

## 5. Future Common Response Concepts

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

For KPI summary items, future payloads may also need:

- `measurementType`
- `measurementUnit`
- `targetRule`
- `targetAnnotation`
- `aggregationMethod`
- `preferredVisualization`
- `computedValue`
- `achievementStatus`
- `riskStatus`
- `numerator`
- `denominator`
- `thresholdRules`

## 6. Historical Organization Summary Draft

Earlier concept:

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

The field names above are retained as historical planning context only. The
Phase 1A stable response shape is the `snake_case` contract documented in
section 3.1.

Important design rule:

Response structure should expose enough semantic metadata so the client does not hardcode KPI-specific meaning by page or by KPI code.

Status semantics should stay explicit:

- `achievementStatus` = pass/fail/unknown based on `targetRule`
- `riskStatus` = red/yellow/green or equivalent based on `thresholdRules` when configured
- when `thresholdRules` are absent, `riskStatus` should remain explicit as `null`, `not_configured`, or similar, rather than derived implicitly

## 7. Department / Workgroup Summary Draft

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

## 8. Unit / Team Summary Draft

Expected concepts:

- hierarchy context
- KPI item list
- owner
- due context
- actual vs target summary
- progress summary
- KPI measurement semantics where needed for rendering
- links to KPI entry detail
- audit availability indicator

## 9. KPI Detail Draft

For individual drill-down, preferred direction is to reuse or align with the existing KPI entry detail model where possible instead of inventing an unrelated dashboard detail contract.

Possible pattern:

- dashboard summary response includes `entryId`
- client links to existing KPI detail read route
- future dashboard API may include lightweight wrapper metadata, but should not duplicate detail logic without a reason

## 10. Permission And Scope Constraints

Explicit design rule:

`Dashboard drill-down must not reveal KPI entries outside user authorization scope.`

The API contract must support:

- read-only dashboard access for `viewer` within scope
- dashboard plus worklist visibility for `editor` within scope
- scope-relevant managerial visibility for `manager`-like future roles
- separation between `system_admin` and business executive scope
- future `role + scope + permission` filtering

Scope resolution must be driven by authorization context, not by hardcoded username rules.

## 11. Data Quality And Warnings

The API contract should allow warnings such as:

- missing value
- overdue workload
- excluded KPI due to unresolved state
- no reporting period
- incomplete lineage or incomplete summary source

Warnings should be structured data, not only human-readable strings.

Future API contract should also support explicit target and calculation explanation fields where the UI needs to explain KPI meaning to users.

For milestone KPI, future API shape may also need:

- `currentMilestoneLevel`
- `targetMilestoneLevel`
- `milestoneLevels`

## 12. Non-Goals

This draft does not commit to:

- route names as final
- response field names as final
- pagination shape as final
- SQL strategy
- caching strategy
- materialized-view strategy

## 13. Acceptance Criteria

This draft is sufficient when it:

- proposes candidate endpoint families
- proposes summary response concepts
- explains drill-down linking strategy
- makes room for KPI measurement semantics and target explanation
- states permission and scope constraints
- avoids hardcoded route logic and role assumptions
- remains clearly separated from implementation work
