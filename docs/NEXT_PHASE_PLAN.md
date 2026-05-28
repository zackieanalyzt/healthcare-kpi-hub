# Next Phase Plan

**Starting Point**: `v0.2-foundation-live-auth-verified`
**Date**: 2026-05-28

## Goal

Begin KPI page read-only expansion from the frozen foundation baseline without introducing mutation workflow drift.

## Recommended Scope

- implement `GET /api/kpi-pages/:pageId`
- implement read-only KPI page detail composition from SQLite
- preserve current auth, RBAC, session, CSRF, and logging contracts
- add frontend KPI page read-only route and loading/error/empty states
- extend seeds only as needed for deterministic KPI page read-only scenarios

## Explicit Non-Goals

- KPI value mutation
- import commit
- dashboard aggregation redesign
- admin mutation UX
- async jobs or realtime

## Entry Criteria

- baseline verification remains green
- no unresolved auth or session regressions
- no ADR changes required for auth, RBAC, or persistence ownership

## Exit Criteria

- KPI page read-only slice works end-to-end
- tests cover auth boundary, empty state, and not-found behavior
- docs are updated if route contracts or seed expectations change
