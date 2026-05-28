import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import type { NavigationWorkgroup } from "@healthcare-kpi-hub/shared-types";
import { fetchNavigation, logout } from "../api";
import { useAuth } from "../providers/AuthProvider";
import { Link, useNavigate } from "react-router-dom";

export function AppShell({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const { user, loading: authLoading, setUser } = useAuth();
  const [navigation, setNavigation] = useState<NavigationWorkgroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setNavigation([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadNavigation() {
      setLoading(true);
      setError(null);
      const response = await fetchNavigation();

      if (cancelled) {
        return;
      }

      if (response.success) {
        setNavigation(response.data.workgroups);
      } else if (response.error.code === "AUTH_UNAUTHENTICATED") {
        setUser(null);
        navigate("/login");
      } else {
        setError(response.error.message);
      }

      setLoading(false);
    }

    void loadNavigation();

    return () => {
      cancelled = true;
    };
  }, [navigate, setUser, user]);

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7f9", color: "#1f2937", display: "grid", gridTemplateColumns: "280px 1fr" }}>
      <aside
        style={{
          borderRight: "1px solid #d1d5db",
          background: "#ffffff",
          padding: "1rem"
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <strong>Navigation</strong>
        </div>
        {authLoading ? <p>Loading user...</p> : null}
        {!authLoading && !user ? <p>Not signed in.</p> : null}
        {user ? (
          <div style={{ marginBottom: "1rem" }}>
            <div>{user.full_name ?? user.username}</div>
            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>{user.role_code}</div>
            <button onClick={handleLogout} style={{ marginTop: "0.75rem" }}>
              Logout
            </button>
          </div>
        ) : null}
        {loading ? <p>Loading navigation...</p> : null}
        {error ? <p>Navigation error: {error}</p> : null}
        {!loading && !error && navigation.length === 0 ? <p>No navigation configured.</p> : null}
        {!loading &&
          navigation.map((workgroup) => (
            <div key={workgroup.id} style={{ marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700 }}>{workgroup.name}</div>
              {workgroup.sections.map((section) => (
                <div key={section.id} style={{ marginTop: "0.5rem", paddingLeft: "0.75rem" }}>
                  <div style={{ fontSize: "0.95rem" }}>{section.name}</div>
                  <div style={{ display: "grid", gap: "0.25rem", marginTop: "0.25rem", paddingLeft: "0.75rem" }}>
                    {section.pages.map((page) => (
                      <Link key={page.id} to={`/pages/${page.id}`}>
                        {page.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
      </aside>
      <div>
      <header
        style={{
          borderBottom: "1px solid #d1d5db",
          padding: "1rem 1.5rem",
          background: "#ffffff"
        }}
      >
        <strong>healthcare-kpi-hub</strong>
      </header>
      <main style={{ padding: "1.5rem" }}>{children}</main>
      </div>
    </div>
  );
}
