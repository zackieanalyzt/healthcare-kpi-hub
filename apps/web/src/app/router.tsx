import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { WorklistPage } from "../features/worklist/pages/WorklistPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { KpiPage } from "../features/kpi/pages/KpiPage";
import { ImportsPage } from "../features/imports/pages/ImportsPage";
import { AdminPage } from "../features/admin/pages/AdminPage";
import { AuditPage } from "../features/audit/pages/AuditPage";

function KpiPageRoute() {
  const params = useParams();
  return <KpiPage pageId={params.pageId ?? ""} />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <AppShell>
              <Navigate to="/worklist" replace />
            </AppShell>
          }
        />
        <Route
          path="/worklist"
          element={
            <AppShell>
              <WorklistPage />
            </AppShell>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AppShell>
              <DashboardPage />
            </AppShell>
          }
        />
        <Route
          path="/pages/:pageId"
          element={
            <AppShell>
              <KpiPageRoute />
            </AppShell>
          }
        />
        <Route
          path="/imports"
          element={
            <AppShell>
              <ImportsPage />
            </AppShell>
          }
        />
        <Route
          path="/admin/*"
          element={
            <AppShell>
              <AdminPage />
            </AppShell>
          }
        />
        <Route
          path="/audit"
          element={
            <AppShell>
              <AuditPage />
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
