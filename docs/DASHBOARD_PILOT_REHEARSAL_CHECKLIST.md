# Dashboard Phase 1A Owner Pilot Rehearsal Checklist

This document provides the preparation, environment setup, and verification scenarios for the owner-led controlled rehearsal of the read-only Organization Dashboard (`/dashboard`).

## 1. Environment & Startup Setup

### Prerequisites
- **Runtime**: Bun (v1.2+ recommended)
- **Code Baseline**: `9308717 chore(web): support dashboard API dev smoke proxy` or later
- **Port mapping**: 
  - API Dev Server: Port 3000
  - Web Dev Server: Port 5173 (with `/api` proxy enabled to port 3000)
- **Database**: Pre-migrated SQLite `apps/api/data/app.db` with seeded metadata and operational entries.

### Startup Steps
1. **Start the API Server**:
   ```bash
   bun run dev:api
   ```
   *Expected Observation*: Terminal shows `{"level":"INFO","event":"api.starting",...,"port":3000,...}`.

2. **Start the Web Server**:
   ```bash
   bun run dev:web
   ```
   *Expected Observation*: Terminal shows Vite dev server ready and listening on `http://localhost:5173/`.

---

## 2. Rehearsal Smoke Scenarios (Phase 1A Read-Only Scope)

Execute the following verification steps in a web browser.

### Scenario D-01: Authentication & Navigation to Dashboard
1. **Action**: Open `http://localhost:5173/` in a browser.
2. **Action**: Log in with seeded admin user credentials:
   - **Username**: `admin.user`
   - **Password**: `dev-password`
3. **Action**: Navigate to the `/dashboard` route (either by clicking the navigation menu link or entering the URL directly).
4. **Expected Observation**:
   - The page loads inside the main app shell.
   - A brief loading state is displayed before the content renders (see Scenario D-05).

---

### Scenario D-02: Organization Summary Card Verification
1. **Action**: Observe the top summary cards in the Organization Dashboard.
2. **Expected Observation**:
   - The dashboard title clearly indicates: `Hospital KPI Overview / Period 2026-05 / Status open`.
   - The following 6 cards are rendered with exact matching labels and values based on SQLite seeds:
     - **Total KPIs**: `7`
     - **Completed**: `1`
     - **Pending**: `3`
     - **Overdue**: `3`
     - **At Risk**: `0`
     - **Achievement %**: `0`
   - All labels match `DASHBOARD_SUMMARY_CARD_LABELS` centralized configuration.

---

### Scenario D-03: Achievement Section & Warnings/Lineage/Meta Verification
1. **Action**: Review the sections below the summary cards.
2. **Expected Observation**:
   - **Achievement Summary**: Shows `Numerator: 0`, `Denominator: 7`, `Achievement: 0%`.
   - **Data Quality Warnings**: Renders warnings for missing KPI metadata (e.g., missing measurement type, missing target rule, invalid aggregation method) for the seeded unconfigured KPIs.
   - **Lineage Summary**: Shows `Records: 7` and lists the lineage info (Definition ID, Assignment ID, and Scope Type) for all 7 related KPIs. Expanding the "Lineage fields" section reveals the correct contract field names.
   - **Contract Meta**: Shows:
     - **Contract**: `phase-1a`
     - **Phase**: `Phase 1A`
     - **Release**: `phase-1a-kickoff`
     - **Generated**: ISO local timestamp matching the generation time.

---

### Scenario D-04: Non-Goal UI Check
1. **Action**: Inspect the entire dashboard page layout and controls.
2. **Expected Observation**:
   - **No Drill-Down**: There must be no drill-down links, buttons, or controls to view department, workgroup, unit, team, or individual dashboard slices.
   - **No Charts**: There must be no chart container, canvas, SVG chart elements, or chart placeholders visible on the page.
   - **No Mutation Behavior**: No buttons or fields to mutate operational KPI entries from the dashboard.

---

### Scenario D-05: Loading, Empty, and Error States E2E Checklist
1. **Loading State Check**:
   - **Action**: Refresh the dashboard page.
   - **Expected Observation**: A readable loading skeleton or text `Loading organization dashboard...` is displayed before the API response is resolved.
2. **Empty State Check (Visual Review)**:
   - **Expected Observation**: If no operational KPI were included in the organization summary database, a readable empty card saying `No operational KPI is included in the organization summary yet.` would be shown.
3. **Error State Check**:
   - **Action**: Keep the Web server running but temporarily terminate the API server (kill port 3000), then refresh the dashboard page.
   - **Expected Observation**: The UI gracefully catches the connection error and displays a clear error card saying: `Unable to reach the dashboard API.`

---

## 3. Defect Logging Framework

If any behavior deviates from the expected observations, log it using the following severity model:

| Severity | Meaning | Example |
|---|---|---|
| **S1 Blocker** | Critical crash, data corruption, or severe security/auth leak | Page crashes on load; raw seed password exposed; unauthorized user reads dashboard. |
| **S2 Major** | Functional defect in summary calculation or status inclusion | Total KPIs or Completed count shows incorrect calculation; lineage records missing. |
| **S3 Minor** | Wording, style layout alignment, or non-breaking UI friction | Spelling error in Thai/English labels; minor spacing/padding mismatch. |
| **S4 Observation** | Out-of-scope feature request, suggestion, or enhancement | Tester asks: "Why can't I click on a KPI to see a chart?" (Record as S4). |

---

## 4. Rehearsal Outcome Decision

At the end of the rehearsal execution, the project owner/facilitator makes one of the following decisions:

- **[ ] PASS**: Rehearsal successfully completed with 0 S1/S2/S3 defects. The Phase 1A.5 gate is fully approved.
- **[ ] PASS WITH MINOR ISSUES**: Rehearsal completed, but minor S3 usability or wording adjustments are needed. Ready for Phase 1B after S3 fixes are committed.
- **[ ] BLOCK**: One or more S1 or S2 defects were found. Rehearsal must be rerun after defects are resolved.
