import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  ApiFailure,
  KpiEntryDetail,
  KpiEntryMutationRequest
} from "@healthcare-kpi-hub/shared-types";
import { fetchKpiEntry, updateKpiEntry } from "../../../app/api";

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

function allowedNextStatuses(status: string) {
  switch (status) {
    case "draft":
      return ["draft", "pending", "locked"];
    case "pending":
      return ["pending", "submitted", "locked"];
    case "submitted":
      return ["submitted", "pending", "locked"];
    default:
      return [status];
  }
}

function formatApiError(error: ApiFailure["error"]) {
  switch (error.code) {
    case "CONFLICT_STALE_WRITE":
      return "This KPI entry was updated by someone else. Refresh and try again.";
    case "CONFLICT_ENTRY_LOCKED":
      return "This KPI entry is locked and can no longer be edited.";
    case "CONFLICT_REPORTING_PERIOD_CLOSED":
      return "This KPI entry belongs to a reporting period that is no longer open.";
    case "AUTH_FORBIDDEN":
      return "You do not have permission to update this KPI entry.";
    case "VALIDATION_FAILED":
      return error.details?.[0]
        ? `Validation failed: ${error.details[0].field} (${error.details[0].issue})`
        : error.message;
    default:
      return error.message;
  }
}

export function KpiEntryPage({ entryId }: { entryId: string }) {
  const [detail, setDetail] = useState<KpiEntryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [statusDraft, setStatusDraft] = useState("");
  const [actualValueDraft, setActualValueDraft] = useState("");
  const [progressValueDraft, setProgressValueDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");

  function resetDrafts(nextDetail: KpiEntryDetail) {
    setStatusDraft(nextDetail.entry.status);
    setActualValueDraft(nextDetail.value.actual_value ?? "");
    setProgressValueDraft(
      nextDetail.value.progress_value === null ? "" : String(nextDetail.value.progress_value)
    );
    setNoteDraft(nextDetail.value.note ?? "");
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setNotFound(false);

      try {
        const response = await fetchKpiEntry(entryId);

        if (cancelled) {
          return;
        }

        if (response.success) {
          setDetail(response.data);
          resetDrafts(response.data);
        } else if (
          response.error.code === "NOT_FOUND_KPI_ENTRY" ||
          response.error.code === "NOT_FOUND_KPI_ENTRY_CONTEXT"
        ) {
          setDetail(null);
          setNotFound(true);
        } else {
          setDetail(null);
          setLoadError(response.error.message);
        }
      } catch {
        if (!cancelled) {
          setDetail(null);
          setLoadError("Unable to reach the API.");
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

  if (loadError) {
    return (
      <section>
        <h1>KPI Entry</h1>
        <p>KPI entry error: {loadError}</p>
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

  async function handleSave() {
    if (!detail) {
      return;
    }

    const payload: KpiEntryMutationRequest = {
      updated_at: detail.entry.updated_at
    };

    if (statusDraft !== detail.entry.status) {
      payload.status = statusDraft;
    }

    const value: KpiEntryMutationRequest["value"] = {};
    if (actualValueDraft !== (detail.value.actual_value ?? "")) {
      value.actual_value = actualValueDraft;
    }

    if (progressValueDraft !== (detail.value.progress_value === null ? "" : String(detail.value.progress_value))) {
      value.progress_value = Number(progressValueDraft);
    }

    if (noteDraft !== (detail.value.note ?? "")) {
      value.note = noteDraft;
    }

    if (Object.keys(value).length > 0) {
      payload.value = value;
    }

    setSaving(true);
    setSaveError(null);

    if (
      progressValueDraft.trim() === "" &&
      progressValueDraft !==
        (detail.value.progress_value === null ? "" : String(detail.value.progress_value))
    ) {
      setSaveError("Progress value cannot be cleared in this first mutation release.");
      setSaving(false);
      return;
    }

    try {
      const response = await updateKpiEntry(entryId, payload);
      if (response.success) {
        setDetail(response.data);
        resetDrafts(response.data);
        setEditMode(false);
      } else {
        setSaveError(formatApiError(response.error));
      }
    } catch {
      setSaveError("Unable to save KPI entry changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <nav style={{ fontSize: "0.95rem", color: "#4b5563" }}>
        <Link to={`/pages/${detail.page.id}`}>{detail.page.name}</Link>
        {" / "}
        <span>{detail.definition.code}</span>
      </nav>

      <header style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>{detail.definition.name}</h1>
          <p style={{ margin: 0, color: "#4b5563" }}>
            {detail.definition.code}
            {detail.definition.unit ? ` (${detail.definition.unit})` : ""}
            {" ยท "}
            {detail.reporting_period.period_key}
          </p>
        </div>
        {detail.entry.editable ? (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "start" }}>
            {!editMode ? (
              <button type="button" onClick={() => setEditMode(true)}>
                Edit entry
              </button>
            ) : (
              <>
                <button type="button" onClick={() => {
                  resetDrafts(detail);
                  setEditMode(false);
                  setSaveError(null);
                }}>
                  Cancel
                </button>
                <button type="button" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </>
            )}
          </div>
        ) : null}
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
          {editMode && detail.entry.editable ? (
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Status</span>
              <select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
                {allowedNextStatuses(detail.entry.status).map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusOption}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div>Status: {detail.entry.status}</div>
          )}
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
        {!hasValue && !editMode ? (
          <p style={{ margin: 0 }}>No value has been recorded for this KPI entry yet.</p>
        ) : editMode && detail.entry.editable ? (
          <div style={{ display: "grid", gap: "0.75rem", maxWidth: "32rem" }}>
            <div>Target: {detail.value.target_value ?? "-"}</div>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Actual</span>
              <input
                value={actualValueDraft}
                onChange={(event) => setActualValueDraft(event.target.value)}
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Progress</span>
              <input
                value={progressValueDraft}
                onChange={(event) => setProgressValueDraft(event.target.value)}
                inputMode="decimal"
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Note</span>
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                rows={4}
              />
            </label>
          </div>
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

      {saveError ? (
        <article style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "1rem", color: "#991b1b" }}>
          <strong>Save error:</strong> {saveError}
        </article>
      ) : null}

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
