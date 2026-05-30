# Dashboard Phase 1B-A Implementation Plan
# Department / Workgroup Backend Slice

**Status**: `planning only — no implementation authorized`
**Phase**: `Phase 1B-A Department/Workgroup Backend Slice Planning`
**Owner decision**: `Option A approved`
**Previous checkpoint**: `f8d1a1b fix: harden dashboard achievement tests before Phase 1B`
**Date**: `2026-05-30`

---

## 1. Context and Scope

Phase 1A delivered the organization-level dashboard: one backend service, one read-only API endpoint, stable type contract, and a passing owner pilot rehearsal.

Phase 1B-A extends the same backend slice **one level down the hierarchy**: department / workgroup summary. No UI, no chart, no cache, no RBAC changes.

Schema fact: `kpi_page_hierarchy` already stores `hierarchy_level IN ('organization', 'department', 'unit', 'individual')` with full seed data for at least two department nodes (`pag_promotion`, `pag_dept_digital_health`). **No migration is required.**

---

## 2. Items That Must Be Done in Phase 1B-A

| Item | Layer | Status |
|---|---|---|
| Extend `DashboardScopeType` to include `"department"` | `shared-types` | R3 — open from audit |
| Add `DEPARTMENT` to `DASHBOARD_SCOPES` config | `packages/config` | planned |
| Add `findDepartmentScopeNode` repository function | `apps/api` | planned |
| Add `listDepartmentEntryRecords` repository function | `apps/api` | planned |
| Add `getDepartmentDashboardSummary` service function | `apps/api` | planned |
| Wire `scope=department&nodeId=:id` in router handler | `apps/api` | planned |
| Service tests: department summary, warnings, lineage | `apps/api` | planned |
| Integration tests: auth, invalid scope, missing nodeId | `apps/api` | planned |
| Update `CURRENT_HANDOFF.md` / `STATUS.md` | `docs` | planned |

---

## 3. API Strategy Decision

### Chosen strategy: reuse `GET /api/dashboard/summary` with scope param + nodeId param

Rationale:
- Phase 1A already routes on `?scope=organization`; the router's rejection at line 374 (`if (scope !== DASHBOARD_SCOPES.ORGANIZATION)`) is the exact extension point
- Consistent with the API contract doc (Section 4, Option B) which already proposes `?scope=department&nodeId=...`
- Avoids introducing a parallel route family before the pattern is validated

Endpoint:

```
GET /api/dashboard/summary?scope=department&nodeId=:pageId&period_key=:key
```

Request rules:
- `scope=department` is the new accepted value alongside `organization`
- `nodeId` is required when `scope=department`; missing `nodeId` returns `400 VALIDATION_FAILED`
- `nodeId` must resolve to an active `kpi_pages` row with `hierarchy_level = 'department'`; mismatch returns `400 VALIDATION_FAILED`
- `period_key` optional; defaults to latest open period (same as organization)
- all other scope values continue to return `400 VALIDATION_FAILED`

Response shape: **same envelope as Phase 1A** — `meta`, `scope`, `period`, `summary_cards`, `achievement`, `warnings`, `lineage`. Only `scope.type` changes from `"organization"` to `"department"`.

---

## 4. DashboardScopeType Extension (R3 from Audit)

**Current** (`shared-types/src/index.ts` line 324):
```ts
export type DashboardScopeType = "organization";
```

**Phase 1B-A change**:
```ts
export type DashboardScopeType = "organization" | "department";
```

**Config** (`packages/config/src/index.ts` line 66–68):
```ts
export const DASHBOARD_SCOPES = {
  ORGANIZATION: "organization",
  DEPARTMENT: "department"        // add
} as const;
```

Both changes must be made before the service and router are updated.

---

## 5. Scope Model: Organization → Department

### Source of truth
Use `kpi_page_hierarchy.hierarchy_level = 'department'` and `parent_kpi_page_id` to confirm the node is a direct or indirect child of the organization root. No new hierarchy table needed.

### Scope resolution rule

1. Resolve organization root (`hierarchy_level = 'organization'`, LIMIT 1) — same as Phase 1A.
2. Accept `nodeId` from query param.
3. Query `kpi_page_hierarchy` WHERE `kpi_page_id = nodeId AND hierarchy_level = 'department'` and `parent_kpi_page_id` is traceable to the organization root (recursive check or direct parent check — see note below).
4. If not found or level mismatch → `400 VALIDATION_FAILED`.

**Implementation note on parent check:**  
For Phase 1B-A, a conservative approach is to check `parent_kpi_page_id = organizationPageId` directly (i.e., only direct children of organization). This avoids recursive parent traversal complexity. If indirect department nodes exist in future, a second planning gate can approve recursion. Record this decision in the plan.

### Denominator scope for department
The recursive CTE in `listOrganizationEntryRecords` already starts from any `page_id` and descends all children. For department scope:
- Start CTE from `departmentPageId` instead of `organizationPageId`
- All descendant unit and individual pages are included in the roll-up — same logic, different root
- Status inclusion/exclusion rules remain identical to Phase 1A (config-driven)

---

## 6. Denominator, Overdue, Warnings, Lineage Reuse

All five reuse Phase 1A logic with **zero semantic changes**:

| Concern | Phase 1A | Phase 1B-A reuse |
|---|---|---|
| Status inclusion | `DASHBOARD_STATUS_RULES.denominatorIncluded` | identical |
| Overdue derivation | `isOverdue()` — hybrid date + explicit status | identical |
| Ambiguous scope detection | `listAmbiguousScopeRecords(db, rootPageId, periodId)` | reuse with `departmentPageId` as root |
| Warning taxonomy | all 7 `DASHBOARD_WARNING_CODE` values | identical |
| Lineage fields | 7 minimum lineage fields | identical |
| Achievement derivation | `deriveAchievementStatus()` — config-driven | identical |
| Risk derivation | `deriveRiskStatus()` — config-driven | identical |

**No new calculation logic is introduced in Phase 1B-A.**

---

## 7. Invalid / Ambiguous Scope Behavior

| Case | Behavior |
|---|---|
| `scope=department` with no `nodeId` | `400 VALIDATION_FAILED` — field: `nodeId`, issue: `required` |
| `nodeId` does not exist in `kpi_page_hierarchy` | `400 VALIDATION_FAILED` — field: `nodeId`, issue: `not_found` |
| `nodeId` exists but `hierarchy_level ≠ department` | `400 VALIDATION_FAILED` — field: `nodeId`, issue: `wrong_hierarchy_level` |
| `nodeId` exists, level correct, but page is inactive | `404 NOT_FOUND` — consistent with organization scope behavior |
| `nodeId` is a department not under the resolved organization root | `400 VALIDATION_FAILED` — field: `nodeId`, issue: `out_of_scope` |
| KPI entries with ambiguous scope within department subtree | `AMBIGUOUS_SCOPE` warning in response — excluded from roll-up |

---

## 8. New Repository Functions Needed

```ts
// Find a specific department node by page_id
findDepartmentScopeNode(db: Database, pageId: string, organizationPageId: string): DashboardDepartmentScopeRecord | null

// Reuse listOrganizationEntryRecords signature — same query, department page as root
// Can alias or accept a generic "rootPageId" parameter
listScopedEntryRecords(db: Database, rootPageId: string, reportingPeriodId: string): DashboardOrganizationEntryRecord[]
```

**Design decision for repository**: Rather than duplicating `listOrganizationEntryRecords`, rename or generalize it to `listScopedEntryRecords(db, rootPageId, periodId)` so both organization and department levels share one query. This keeps the recursive CTE in one place and reduces drift risk.

---

## 9. Service Function

```ts
getDepartmentDashboardSummary(
  db: Database,
  options: { nodeId: string; periodKey?: string }
): DashboardDepartmentSummary
```

`DashboardDepartmentSummary` shape is identical to `DashboardOrganizationSummary` except:
- `scope.type` = `"department"`
- `scope.id` = department `page_id`
- `scope.name` = department `page_name`

**Option**: reuse `DashboardOrganizationSummary` type in `shared-types` by widening `scope.type` to `DashboardScopeType` (which will be `"organization" | "department"`). This avoids creating a parallel type and keeps the contract stable. This is the **recommended approach**.

---

## 10. Test Plan

### Service unit tests (`service.test.ts` or new `department-service.test.ts`)

| Test | Expected |
|---|---|
| Department summary returns correct KPI counts for a department scope | pass |
| Department summary excludes KPIs from sibling departments | pass |
| Department summary includes KPIs from descendant unit and individual pages | pass |
| Department summary emits `AMBIGUOUS_SCOPE` warning for out-of-hierarchy entries | pass |
| Department summary achievementStatus and riskStatus derivation (reuse same config) | pass |
| Department summary overdue count uses hybrid rule | pass |
| Empty department (no included KPIs) returns stable zero-value shape | pass |
| Missing `nodeId` is rejected before reaching service | router test |
| Invalid `nodeId` (wrong level) is rejected with correct error | router / integration test |

### Integration tests (`dashboard.integration.test.ts`)

| Test | Expected |
|---|---|
| `GET /api/dashboard/summary?scope=department&nodeId=valid_id` returns 200 for viewer | pass |
| `GET /api/dashboard/summary?scope=department` without nodeId returns 400 | pass |
| `GET /api/dashboard/summary?scope=department&nodeId=org_id` (wrong level) returns 400 | pass |
| `GET /api/dashboard/summary?scope=department&nodeId=valid_id` returns correct scope type | pass |
| `GET /api/dashboard/summary?scope=unit` still returns 400 (unchanged scope guard) | pass |
| Permission check still enforced for department scope | pass |

### Typecheck
All 4 packages must pass `tsc --noEmit` after `DashboardScopeType` is extended.

---

## 11. Files to Change in Phase 1B-A Implementation

```
packages/shared-types/src/index.ts           — extend DashboardScopeType
packages/config/src/index.ts                 — add DASHBOARD_SCOPES.DEPARTMENT
apps/api/src/modules/dashboard/repository.ts — add findDepartmentScopeNode, generalize listScopedEntryRecords
apps/api/src/modules/dashboard/service.ts    — add getDepartmentDashboardSummary
apps/api/src/modules/dashboard/index.ts      — export new service function
apps/api/src/app/router.ts                   — extend handleDashboardSummary dispatch
apps/api/src/modules/dashboard/service.test.ts  — new department summary unit tests
apps/api/src/app/dashboard.integration.test.ts  — new department integration tests
docs/CURRENT_HANDOFF.md                      — update
docs/STATUS.md                               — update
```

**No schema migration needed.** `kpi_page_hierarchy` already has `department` as a valid `hierarchy_level` value and seed data has department nodes.

---

## 12. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Phase 1B-A expands scope beyond department by creep | Medium | Scope guard in router must stay `scope ∈ {organization, department}` only; `unit` / `individual` still rejected |
| `listScopedEntryRecords` refactor breaks existing organization tests | Low | Rename is backward-compatible if parameter signature is unchanged; existing org tests cover regression |
| Department node not under org root — ambiguous parent check | Low | Conservative: require `parent_kpi_page_id = orgRootPageId` for Phase 1B-A; recursive parent traversal deferred |
| `DashboardScopeType` widening breaks frontend TypeScript | Low | Web has no department-scope fetch yet; type extension is additive; typecheck will catch regressions |

---

## 13. Open Owner Decisions Before Implementation

- **Confirm parent scope check strategy**: direct parent only (`parent_kpi_page_id = orgPageId`) OR recursive ancestor traversal from organization root. **Recommended: direct parent only for Phase 1B-A.**
- **Confirm `listScopedEntryRecords` refactor**: rename from `listOrganizationEntryRecords` with no signature change (just root param renamed). If owner prefers no refactor, a new dedicated function can be added instead.

---

## 14. What Phase 1B-A Does NOT Include

- unit/team scope (deferred to Phase 1B-B or later)
- individual KPI detail scope (deferred)
- frontend UI changes — dashboard page stays organization-only
- chart library
- materialized cache
- RBAC changes
- import changes
- KPI mutation behavior changes
- `scope=unit`, `scope=individual`, `scope=team` support

---

## 15. Acceptance Criteria for This Planning Document

- [x] Endpoint strategy decided: reuse summary endpoint with `scope=department&nodeId=:id`
- [x] `DashboardScopeType` extension documented
- [x] Scope model and parent check strategy documented
- [x] Denominator/overdue/warnings/lineage reuse confirmed (no new logic)
- [x] Invalid/ambiguous scope behavior specified
- [x] Repository refactor path proposed
- [x] Test plan enumerated
- [x] Files to change listed
- [x] Risks and open decisions documented
- [x] Phase 1B-A boundary confirmed (department only; unit/individual deferred)
- [ ] Owner confirms parent scope check strategy before implementation begins
