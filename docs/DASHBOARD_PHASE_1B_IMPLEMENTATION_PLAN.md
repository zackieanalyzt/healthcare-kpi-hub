# Dashboard Phase 1B Implementation Planning

**Status**: `planning only — no implementation authorized`
**Phase**: `Phase 1B Implementation Planning`
**Previous baseline**: `656fb45 docs: record Phase 1A dashboard owner pilot rehearsal`
**Date**: `2026-05-30`

---

## 1. Purpose

This document proposes the Phase 1B implementation scope following the successful completion of Phase 1A:

- Phase 1A is complete: metadata foundation, organization summary backend, stable API contract, organization dashboard UI skeleton, API+Web smoke, and owner pilot rehearsal all passed.
- This document proposes what the **narrowest safe next slice** should be.

This is a **docs-only planning document**. It does not authorize or begin any implementation.

---

## 2. What Phase 1A Delivered

| Area | Status |
|---|---|
| KPI measurement metadata foundation (backend schema) | ✅ done |
| Organization summary read-model service | ✅ done |
| `GET /api/dashboard/summary?scope=organization` | ✅ done |
| Organization dashboard UI skeleton | ✅ done |
| API+Web dev proxy smoke (Phase 1A.4) | ✅ done |
| UI hardening: loading/empty/error states | ✅ done |
| Owner pilot rehearsal (5 scenarios, 0 defects) | ✅ done |
| Vite dev proxy for local API smoke | ✅ done |

---

## 3. What Is Still Deferred From Phase 1A

These items are explicitly deferred and must not start without a new owner decision:

- department/workgroup drill-down backend or UI
- unit/team drill-down backend or UI
- individual KPI detail dashboard screen
- chart library installation or chart rendering
- materialized cache or async jobs
- import workflow
- RBAC or permission model redesign
- KPI mutation behavior changes
- advanced aggregation or new rule engine
- frontend form changes

---

## 4. Proposed Phase 1B Implementation Options

Two realistic, well-bounded options are proposed below. Only one should be approved by the owner before implementation begins.

---

### Option A: Department / Workgroup Dashboard Backend Slice (Recommended first)

**What it covers:**

- Backend service + read-model assembly for department/workgroup scope
- New read-only API endpoint: `GET /api/dashboard/summary?scope=department&nodeId=:id`
- Backend tests covering department-scope summary, warnings, lineage, and scope safety
- No UI changes beyond what is already rendered in the organization dashboard

**Why it is the right next slice:**

- The organization summary and backend test suite are already proven — the next level of the hierarchy is the natural extension
- It unlocks the full drill-down data model one level at a time without requiring chart or UI investment
- It is purely backend + service, so it stays in the proven Phase 1A code path
- The read-model design doc (`DASHBOARD_READ_MODEL_DESIGN.md`) already defines department-scope conceptual structure
- Keeps the No-Hardcode Rule: scope-driven resolution via existing `nodeId`, not hardcoded department names
- Does not require RBAC changes, chart library, or materialized cache

**Boundary:**

| Allowed | Forbidden |
|---|---|
| Department/workgroup summary service + test | UI changes beyond existing skeleton |
| New scope-driven API route for department scope | Chart library |
| Backend-only tests | Drill-down UI controls |
| CURRENT_HANDOFF / STATUS / docs update | Unit/team or individual level |
| | Import / RBAC / KPI mutation |

**Owner decisions required before implementation:**

- Confirm `scope=department` is the accepted query param extension (vs new route like `/api/dashboard/hierarchy/:nodeId`)
- Confirm department-scope denominator rules (same as organization, or narrowed to that department's entries only)
- Confirm how department scope identifies itself: via existing `pag_dept_*` hierarchy page IDs or a separate taxonomy

---

### Option B: Organization Dashboard UI Refinement + Achievement Display

**What it covers:**

- Refine the read-only organization dashboard UI for improved readability
- Display `achievementStatus` per KPI item (from existing Phase 1A API data)
- Display `riskStatus` per KPI item (showing `not_configured` explicitly)
- Polish layout: summary cards, warnings, lineage, meta sections
- No new API or backend changes

**Why it is a valid alternative:**

- Phase 1A owner rehearsal revealed the dashboard is functional but sparse in how KPI-level insight is shown
- The existing API already returns all fields needed for per-KPI achievement/risk display
- Frontend-only and stays entirely within current API contract
- Safe to do before any drill-down backend work

**Boundary:**

| Allowed | Forbidden |
|---|---|
| UI layout and wording improvements | New API endpoint |
| Per-KPI achievement/risk display using existing API data | Chart library |
| Loading/empty/error state polish | Drill-down controls |
| Frontend test coverage | Department/unit/team level |
| CURRENT_HANDOFF / STATUS / docs update | RBAC / import / KPI mutation |

**Owner decisions required before implementation:**

- Confirm which KPI-level display fields are acceptable in Phase 1B UI (e.g., show `achievementStatus` per lineage row)
- Confirm the no-chart constraint still holds for this UI pass (no visualization beyond counts and text)

---

## 5. Risks Per Option

| Risk | Option A (Dept Backend) | Option B (UI Refinement) |
|---|---|---|
| Scope creep into UI | Low (backend-only) | Medium (UI work invites feature creep) |
| Schema/migration risk | Low (reuses Phase 1A schema) | None |
| Breaking Phase 1A API | None | None |
| Chart/drill-down pressure | Low | Medium (UI work may invite "can we add a chart?") |
| Owner confusion about drill-down | Medium (backend exists but no UI) | Low |
| No-Hardcode Rule violation | Low if scope-driven via nodeId | Low if config-driven display |

---

## 6. Recommended Sequencing

If both options are eventually approved:

1. **Phase 1B-A first**: Department/workgroup backend slice — proves the multi-scope read model works before investing in UI
2. **Phase 1B-B second**: UI refinement once department backend is stable — avoids refactoring the UI twice

---

## 7. What Does NOT Change in Phase 1B

Regardless of which option is chosen:

- No chart library installation
- No drill-down UI controls (department/unit/individual links) until explicitly approved per level
- No RBAC changes
- No import changes
- No KPI mutation behavior changes
- No materialized cache
- No unit/team or individual KPI dashboard scope in Phase 1B

---

## 8. Acceptance Criteria for This Planning Document

This document is complete when it:

- [ ] Clearly defines two bounded implementation options with scope tables
- [ ] Lists required owner decisions per option
- [ ] Identifies risks
- [ ] Recommends sequencing
- [ ] Stays docs-only with no code, schema, or API changes
- [ ] Is committed and pushed to `main`

---

## 9. Owner Decision Required Before Phase 1B Opens

Owner must explicitly choose:

- **Option A**: Department/workgroup dashboard backend slice
- **Option B**: Organization dashboard UI refinement + achievement display
- **Both in sequence A then B**
- **Neither** (hold at Phase 1A checkpoint)

This document does not open implementation. Implementation begins only after owner explicit approval.
