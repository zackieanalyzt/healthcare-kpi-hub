# Dashboard Phase 1A Technical Audit

**Status**: `audit complete — R1 R2 closed by Phase 1A.7 test hardening`
**Phase**: `Developer Capability Probe: Phase 1A Dashboard Technical Audit`
**Checkpoint**: `96ca578 docs: plan Phase 1B dashboard implementation`
**Date**: `2026-05-30`
**Verdict**: `ready_with_risks`

---

## 1. Audit Summary

Phase 1A backend + API + web skeleton is **structurally sound and ready to serve as the Phase 1B foundation**, with three known risks that are manageable but should be tracked before Phase 1B implementation opens.

---

## 2. Area-by-Area Findings

---

### Area 1: API Contract Stability
**Verdict: STABLE ✅**

**Evidence:**
- `apps/api/src/app/router.ts` line 362–385: `handleDashboardSummary` routes only `GET /api/dashboard/summary?scope=organization`. Unsupported scopes (e.g. `scope=department`) return `400 VALIDATION_FAILED`.
- `packages/config/src/index.ts` line 55–68: `DASHBOARD_RELEASE.version = "phase-1a"`, `DASHBOARD_API.summaryPath = "/api/dashboard/summary"` — both centralized, no hardcoded strings in handler.
- `packages/shared-types/src/index.ts` line 357–382: `DashboardOrganizationSummary` type locks response shape (meta, scope, period, summary_cards, achievement, warnings, lineage).
- Integration test `dashboard.integration.test.ts` line 28–35: asserts exact card code order matches `DASHBOARD_SUMMARY_CARD_CODES` constants — contract is enum-guarded.

**Risk**: `scope=department` already returns `400` — correct scope guard. Phase 1B Option A will need to update this rejection to a dispatch, which is a single clean extension point in `router.ts` line 374.

---

### Area 2: Config / No-Hardcode Compliance
**Verdict: FULLY COMPLIANT ✅**

**Evidence:**
- `apps/api/src/modules/dashboard/service.ts` lines 1–19: **zero hardcoded strings**. All enums imported from `@healthcare-kpi-hub/config`. Status rules, warning codes, measurement types, achievement/risk statuses, aggregation method allow-lists — all config-driven.
- `apps/web/src/features/dashboard/pages/DashboardPage.tsx` lines 2–5: frontend uses `DASHBOARD_SUMMARY_CARD_CODES` and `DASHBOARD_LINEAGE_FIELD_NAMES` from config — no hardcoded card labels or field names.
- `packages/config/src/index.ts` lines 188–213: `DASHBOARD_STATUS_RULES` defines `denominatorIncluded`, `denominatorExcluded`, `overdueSourceStatuses`, `completedStatuses`, `pendingStatuses`, `atRiskStatuses` — all policy-centralized.

**No violations found.** The no-hardcode rule is structurally enforced at every layer.

---

### Area 3: Test Coverage Gaps
**Verdict: ADEQUATE FOR PHASE 1A, GAPS NOTED FOR PHASE 1B ⚠️**

**What is covered:**

| Test File | Scope | Count |
|---|---|---|
| `service.test.ts` | Service unit: achievement, risk, overdue, denominator, warnings, lineage, empty state, enum centralization | 7 tests |
| `dashboard.integration.test.ts` | API: auth, 403 forbidden, 400 invalid scope, read-only POST rejection, full contract | 4 tests |
| `DashboardPage.test.tsx` | UI: loading/error/ready states, warning/lineage/meta render, no drill-down assertion | 7 tests |

**Gaps identified:**

1. **`count` and `milestone` target rule paths not fully exercised in service unit tests** — `service.test.ts` covers `percentage` and `boolean` achievement derivation but only validates `milestone` for the warning path (missing levels), not for `achievementStatus = achieved/not_achieved` when levels are present. `count` achievement path is similarly unexercised.
   - Risk for Phase 1B: if Phase 1B expands to department scope and introduces new KPI entries of type `count` or `milestone` with actual values, the achievement derivation may be silently wrong before it is first tested.

2. **`stale_progress_data` warning is not exercised in any test** — `service.ts` line 96–108 defines the stale check but no test asserts this warning code fires. `DASHBOARD_RUNTIME_RULES.staleProgressMaxAgeDays = 14` is the threshold.

3. **No frontend fetch/API integration test** — `DashboardPage.test.tsx` tests `DashboardView` (pure component) only. `DashboardPage` itself (the `useEffect` + `fetchOrganizationDashboardSummary` path) has only a `toBeDefined()` smoke assertion (line 109–112). Network fetch behavior and error handling in the real `fetch` path are not exercised.

4. **`packages/config` and `packages/shared-types` have no test files** — confirmed by `bun run test` output: `"No tests for shared-types yet"` / `"No tests for config yet"`. Config drift cannot be caught automatically.

---

### Area 4: Frontend / API Integration Risk
**Verdict: LOW RISK ✅ — one structural note**

**Evidence:**
- `apps/web/src/app/api.ts` line 68: `fetchOrganizationDashboardSummary()` is the only dashboard fetch function — correctly isolated.
- `apps/web/vite.config.ts` (committed in `9308717`): proxies `/api` → `localhost:3000` for dev. This is dev-only and does not affect production fetch path.
- `DashboardPage.tsx` line 204–207: `response.success` branch correctly reads `response.data` (typed `DashboardOrganizationSummary`); `response.error.message` on failure. Contract alignment is type-safe via `shared-types`.

**Structural note (not a defect):**  
`DashboardScopeType` in `shared-types/src/index.ts` line 324 is defined as `type DashboardScopeType = "organization"` — a literal union with one member. When Phase 1B adds `"department"`, this type must be extended. This is a **planned extension point**, not a defect, but it must not be forgotten.

---

### Area 5: Migration / Backward Compatibility Risk
**Verdict: LOW RISK ✅**

**Evidence:**
- Phase 1A added metadata columns (`measurement_type`, `target_operator`, `target_value`, `target_direction`, `aggregation_method`, `threshold_rules`, `milestone_levels`, etc.) to `kpi_definitions` — all nullable, non-breaking.
- `service.ts` line 481–509: all metadata fields are read with null-safety guards. Incomplete metadata produces warnings, not crashes.
- `repository.ts` line 106–168: recursive CTE (`WITH RECURSIVE hierarchy_scope`) is SQLite-compatible. No new tables were introduced in Phase 1A; queries join existing operational tables only.

**Risk for Phase 1B Option A:** Adding department-scope queries will extend the recursive CTE or add a sibling query. The current `findOrganizationScopeRoot` (line 83–104) selects `WHERE hierarchy_level = ?1` with `LIMIT 1` — this pattern is reusable for department scope by changing the level param, but it would return only one root node. A department list query requires removing `LIMIT 1`. This is known and manageable.

---

### Area 6: Scope Guard Risk Before Opening Phase 1B
**Verdict: CLEAN ✅ — guard is effective**

**Evidence:**
- `router.ts` line 374–380: `if (scope !== DASHBOARD_SCOPES.ORGANIZATION)` returns `400`. No partial implementation of department or unit scope exists in any handler, service, or repository.
- `DashboardPage.tsx` line 181–189 (test): `does not render drill-down controls or chart placeholders` asserts no `"Open department"`, `"Open workgroup"`, `"Open unit"`, `"Open entry"`, or `"Chart"` text appears.
- `packages/config/src/index.ts` line 66–68: `DASHBOARD_SCOPES = { ORGANIZATION: "organization" }` — `department`, `unit`, `team` are not registered. Any Phase 1B code that tries to use an unregistered scope will fail the integration test immediately.

**Scope is clean. No accidental Phase 1B surface exists.**

---

### Area 7: Things to Fix or Confirm Before Phase 1B
**Verdict: 3 recommended fixes — none are blockers for baseline stability**

| # | Item | Severity | File | Status |
|---|---|---|---|---|
| R1 | `count` and `milestone` achievement derivation paths untested | Medium | `service.test.ts` | ✅ Closed — tests added in Phase 1A.7; milestone test revealed `compareNumeric` missing `MILESTONE_AT_LEAST`/`MILESTONE_EXACT` — bug fixed in `service.ts` |
| R2 | `stale_progress_data` warning not exercised by any test | Low | `service.test.ts` | ✅ Closed — test added in Phase 1A.7 |
| R3 | `DashboardScopeType` is a literal single-member union | Low | `shared-types/src/index.ts` | ⚠️ Open — extend to `"organization" \| "department"` when Phase 1B-A opens |

**None of these block Phase 1A as a foundation.** They are items to track before Phase 1B scope expands.

---

## 3. Validation

```
typecheck: passed (all 4 packages)
tests:     90 pass / 0 fail (API) + 15 pass / 0 fail (web) — 105 total
git status: docs/DASHBOARD_PHASE_1A_TECHNICAL_AUDIT.md + service.test.ts + service.ts modified
git diff --check: passed
```

**Bug found and fixed by tests (Phase 1A.7):**
- `service.ts` `compareNumeric` was missing `MILESTONE_AT_LEAST` and `MILESTONE_EXACT` cases, causing milestone KPI achievement derivation to silently return `NOT_CONFIGURED` regardless of actual value.
- Fix: added `case DASHBOARD_TARGET_OPERATOR.MILESTONE_AT_LEAST:` (maps to `>=`) and `case DASHBOARD_TARGET_OPERATOR.MILESTONE_EXACT:` (maps to `===`) in `compareNumeric` (service.ts lines 145–155).
- No other production code changes were made.

---

## 4. Verdict

```
Verdict: ready_with_risks (R1 R2 now closed by Phase 1A.7)

Phase 1A is technically sound and safe to serve as Phase 1B base.
No hardcode violations found.
API contract is stable and scope-guarded.
Frontend/API integration is type-safe.
Migration risk is low (nullable metadata columns, no new tables).
R1 closed: count and milestone achievement tests added; milestone bug fixed in compareNumeric.
R2 closed: stale_progress_data warning test added and confirmed passing.
R3 open: DashboardScopeType must be extended to include "department" when Phase 1B-A opens.
All 105 tests pass after Phase 1A.7 hardening.
```
