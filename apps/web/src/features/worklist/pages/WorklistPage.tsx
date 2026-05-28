import { useEffect, useState } from "react";
import type { WorklistItem } from "@healthcare-kpi-hub/shared-types";
import { Link } from "react-router-dom";
import { fetchWorklist } from "../../../app/api";

export function WorklistPage() {
  const [items, setItems] = useState<WorklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const response = await fetchWorklist();

      if (cancelled) {
        return;
      }

      if (response.success) {
        setItems(response.data.items);
      } else {
        setError(response.error.message);
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <h1>Worklist</h1>
      {loading ? <p>Loading worklist...</p> : null}
      {error ? <p>Worklist error: {error}</p> : null}
      {!loading && !error && items.length === 0 ? <p>No worklist items for the current period.</p> : null}
      {!loading && !error && items.length > 0 ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {items.map((item) => (
            <article
              key={item.entry_id}
              style={{
                background: "#ffffff",
                border: "1px solid #d1d5db",
                padding: "1rem",
                borderRadius: "0.5rem"
              }}
            >
              <div style={{ fontWeight: 700 }}>{item.kpi_name}</div>
              <div>{item.workgroup_name} / {item.section_name} / {item.page_name}</div>
              <div>Status: {item.status}</div>
              <div>Assigned to: {item.assigned_to ?? "-"}</div>
              <div>Editable: {item.editable ? "Yes" : "No"}</div>
              <Link to={`/pages/${item.page_id}`}>Open page</Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
