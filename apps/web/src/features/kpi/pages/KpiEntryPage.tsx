import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { KpiEntryDetail } from "@healthcare-kpi-hub/shared-types";
import { fetchKpiEntry } from "../../../app/api";

function renderLevel(level: KpiEntryDetail["hierarchy"]["current_node"]["hierarchy_level"]) {
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

export function KpiEntryPage({ entryId }: { entryId: string }) {
  const [detail, setDetail] = useState<KpiEntryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const response = await fetchKpiEntry(entryId);

        if (cancelled) {
          return;
        }

        if (response.success) {
          setDetail(response.data);
        } else if (
          response.error.code === "NOT_FOUND_KPI_ENTRY" ||
          response.error.code === "NOT_FOUND_KPI_ENTRY_CONTEXT"
        ) {
          setDetail(null);
          setNotFound(true);
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
  }, [entryId]);

  if (loading) {
    return (
      <section>
        <h1>KPI Entry</h1>
        <p>Loading KPI entry...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>KPI Entry</h1>
        <p>KPI entry error: {error}</p>
      </section>
    );
  }

  if (notFound || !detail) {
    return (
      <section>
        <h1>KPI Entry</h1>
        <p>KPI entry not found.</p>
      </section>
    );
  }

  const hasValue =
    detail.value.target_value !== null ||
    detail.value.actual_value !== null ||
    detail.value.progress_value !== null ||
    detail.value.note !== null ||
    detail.value.extra_json !== null;

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <nav style={{ fontSize: "0.95rem", color: "#4b5563" }}>
        <Link to={`/pages/${detail.page.id}`}>{detail.page.name}</Link>
        {" / "}
        <span>{detail.definition.code}</span>
      </nav>

      <header>
        <h1 style={{ marginBottom: "0.25rem" }}>{detail.definition.name}</h1>
        <p style={{ margin: 0, color: "#4b5563" }}>
          {detail.definition.code}
          {detail.definition.unit ? ` (${detail.definition.unit})` : ""}
          {" · "}
          {detail.reporting_period.period_key}
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
        }}
      >
        <article style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Workflow</h2>
          <div>Status: {detail.entry.status}</div>
          <div>Assigned to: {detail.entry.assigned_to ?? "-"}</div>
          <div>Due at: {detail.entry.due_at ?? "-"}</div>
          <div>Updated at: {detail.entry.updated_at}</div>
          <div>Updated by: {detail.entry.updated_by ?? "-"}</div>
          <div>Editable: {detail.entry.editable ? "Yes" : "No"}</div>
        </article>

        <article style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Template Context</h2>
          <div>Preset: {detail.definition.preset_code}</div>
          <div>Value Type: {detail.definition.value_type}</div>
          <div>Owner Label: {detail.definition.owner_label ?? "-"}</div>
          <div>Period Type: {detail.reporting_period.period_type}</div>
          <div>Period Status: {detail.reporting_period.status}</div>
        </article>

        <article style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Hierarchy Context</h2>
          <div>Current Level: {renderLevel(detail.hierarchy.current_node.hierarchy_level)}</div>
          <div>Current Owner: {detail.hierarchy.current_node.owner_user?.full_name ?? detail.hierarchy.current_node.owner_label ?? "-"}</div>
          <div>Parent: {detail.hierarchy.parent_node?.name ?? "-"}</div>
          <div>Child Nodes: {detail.hierarchy.child_nodes.length}</div>
        </article>
      </div>

      <article style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Current Value</h2>
        {!hasValue ? (
          <p style={{ margin: 0 }}>No value has been recorded for this KPI entry yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <div>Target: {detail.value.target_value ?? "-"}</div>
            <div>Actual: {detail.value.actual_value ?? "-"}</div>
            <div>Progress: {detail.value.progress_value ?? "-"}</div>
            <div>Note: {detail.value.note ?? "-"}</div>
            <div>Extra JSON: {detail.value.extra_json ?? "-"}</div>
          </div>
        )}
      </article>

      <article style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Recent History</h2>
        {detail.history.length === 0 ? (
          <p style={{ margin: 0 }}>No audit history is available for this KPI entry yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {detail.history.map((item) => (
              <div key={item.audit_event_id} style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.75rem" }}>
                <div style={{ fontWeight: 700 }}>{item.action}</div>
                <div>Actor: {item.actor_username ?? "-"}</div>
                <div>Occurred at: {item.occurred_at}</div>
                <div>Summary: {item.summary ?? "-"}</div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
