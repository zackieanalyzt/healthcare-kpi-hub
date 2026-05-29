import { useEffect, useState } from "react";
import type { KpiPageDetail } from "@healthcare-kpi-hub/shared-types";
import { fetchKpiPage } from "../../../app/api";

function renderLevel(level: KpiPageDetail["hierarchy"]["current_node"]["hierarchy_level"]) {
  switch (level) {
    case "organization":
      return "Organization";
    case "department":
      return "Department";
    case "unit":
      return "Unit / Team";
    case "individual":
      return "Individual";
    default:
      return level;
  }
}

export function KpiPage({ pageId }: { pageId: string }) {
  const [detail, setDetail] = useState<KpiPageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emptyState, setEmptyState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setEmptyState(null);
      try {
        const response = await fetchKpiPage(pageId);

        if (cancelled) {
          return;
        }

        if (response.success) {
          setDetail(response.data);
          if (response.data.assigned_kpis.length === 0) {
            setEmptyState("No KPI assignments are configured for this hierarchy node yet.");
          }
        } else if (response.error.code === "NOT_FOUND_KPI_PAGE") {
          setDetail(null);
          setEmptyState("KPI page not found.");
        } else {
          setDetail(null);
          setError(response.error.message);
        }
      } catch {
        if (!cancelled) {
          setDetail(null);
          setError("Unable to reach the API.");
        }
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  if (loading) {
    return (
      <section>
        <h1>KPI Page</h1>
        <p>Loading KPI page...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>KPI Page</h1>
        <p>KPI page error: {error}</p>
      </section>
    );
  }

  if (!detail) {
    return (
      <section>
        <h1>KPI Page</h1>
        <p>{emptyState ?? "No KPI page data is available."}</p>
      </section>
    );
  }

  const { page, hierarchy, current_period: currentPeriod, assigned_kpis: assignedKpis } = detail;

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ marginBottom: "0.25rem" }}>{page.name}</h1>
        <p style={{ margin: 0, color: "#4b5563" }}>{page.description ?? "No description provided."}</p>
      </header>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        <article style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Hierarchy Context</h2>
          <div>Level: {renderLevel(hierarchy.current_node.hierarchy_level)}</div>
          <div>Owner: {hierarchy.current_node.owner_user?.full_name ?? hierarchy.current_node.owner_label ?? "-"}</div>
          <div>Workgroup: {page.workgroup.name}</div>
          <div>Section: {page.section.name}</div>
        </article>

        <article style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Parent Node</h2>
          {hierarchy.parent_node ? (
            <>
              <div>{hierarchy.parent_node.name}</div>
              <div style={{ color: "#6b7280" }}>{renderLevel(hierarchy.parent_node.hierarchy_level)}</div>
              <div>Owner: {hierarchy.parent_node.owner_user?.full_name ?? hierarchy.parent_node.owner_label ?? "-"}</div>
            </>
          ) : (
            <p style={{ margin: 0 }}>This node is the top of the current KPI ownership hierarchy.</p>
          )}
        </article>

        <article style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Current Period</h2>
          {currentPeriod ? (
            <>
              <div>{currentPeriod.period_key}</div>
              <div>Status: {currentPeriod.status}</div>
              <div>Window: {currentPeriod.starts_at} to {currentPeriod.ends_at}</div>
            </>
          ) : (
            <p style={{ margin: 0 }}>No open reporting period is available.</p>
          )}
        </article>
      </div>

      <article style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Child Nodes</h2>
        {hierarchy.child_nodes.length === 0 ? (
          <p style={{ margin: 0 }}>No child hierarchy nodes are linked to this page.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {hierarchy.child_nodes.map((child) => (
              <div key={child.page_id} style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.75rem" }}>
                <div style={{ fontWeight: 700 }}>{child.name}</div>
                <div style={{ color: "#6b7280" }}>{renderLevel(child.hierarchy_level)}</div>
                <div>Owner: {child.owner_user?.full_name ?? child.owner_label ?? "-"}</div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Assigned KPI Items</h2>
        {emptyState ? (
          <p style={{ margin: 0 }}>{emptyState}</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {assignedKpis.map((item) => (
              <div key={item.definition.id} style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.75rem" }}>
                <div style={{ fontWeight: 700 }}>{item.definition.name}</div>
                <div>{item.definition.code} {item.definition.unit ? `(${item.definition.unit})` : ""}</div>
                <div>Definition Owner: {item.definition.owner_label ?? "-"}</div>
                <div>Status: {item.assignment.status ?? "No current assignment"}</div>
                <div>Assigned to: {item.assignment.assigned_to ?? "-"}</div>
                <div>Due at: {item.assignment.due_at ?? "-"}</div>
                <div>Updated by: {item.assignment.updated_by ?? "-"}</div>
                <div>Editable: {item.assignment.editable ? "Yes" : "No"}</div>
                <div>Target: {item.value.target_value ?? "-"}</div>
                <div>Actual: {item.value.actual_value ?? "-"}</div>
                <div>Progress: {item.value.progress_value ?? "-"}</div>
                <div>Note: {item.value.note ?? "-"}</div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
