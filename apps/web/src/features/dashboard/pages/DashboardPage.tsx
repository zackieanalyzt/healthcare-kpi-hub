import { useEffect, useState } from "react";
import {
  DASHBOARD_LINEAGE_FIELD_NAMES,
  DASHBOARD_SUMMARY_CARD_CODES
} from "@healthcare-kpi-hub/config";
import type { DashboardOrganizationSummary } from "@healthcare-kpi-hub/shared-types";
import { fetchOrganizationDashboardSummary } from "../../../app/api";

type DashboardLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; summary: DashboardOrganizationSummary };

function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function cardValue(
  summary: DashboardOrganizationSummary,
  code: keyof typeof DASHBOARD_SUMMARY_CARD_CODES
): number {
  return summary.summary_cards.find((card) => card.code === DASHBOARD_SUMMARY_CARD_CODES[code])?.value ?? 0;
}

function isEmptyDashboard(summary: DashboardOrganizationSummary): boolean {
  return cardValue(summary, "total") === 0;
}

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #d1d5db",
  borderRadius: "0.5rem",
  padding: "1rem"
} as const;

export function DashboardView({ state }: { state: DashboardLoadState }) {
  if (state.status === "loading") {
    return (
      <section>
        <h1>Organization Dashboard</h1>
        <p>Loading organization dashboard...</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section>
        <h1>Organization Dashboard</h1>
        <p>Dashboard error: {state.message}</p>
      </section>
    );
  }

  const { summary } = state;
  const lineagePreview = summary.lineage.slice(0, 3);

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ marginBottom: "0.25rem" }}>Organization Dashboard</h1>
        <p style={{ margin: 0, color: "#4b5563" }}>
          {summary.scope.name} / {summary.period.key} / {summary.period.status}
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))"
        }}
      >
        {summary.summary_cards.map((card) => (
          <article key={card.code} style={panelStyle}>
            <div style={{ color: "#4b5563", fontSize: "0.9rem" }}>{card.label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{card.value}</div>
          </article>
        ))}
      </div>

      {isEmptyDashboard(summary) ? (
        <article style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Empty State</h2>
          <p style={{ margin: 0 }}>No operational KPI is included in the organization summary yet.</p>
        </article>
      ) : null}

      <article style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Achievement</h2>
        <div>Numerator: {summary.achievement.numerator}</div>
        <div>Denominator: {summary.achievement.denominator}</div>
        <div>Achievement: {summary.achievement.percent}%</div>
      </article>

      <article style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Warnings</h2>
        {summary.warnings.length === 0 ? (
          <p style={{ margin: 0 }}>No dashboard data quality warnings.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {summary.warnings.map((warning, index) => (
              <div key={`${warning.code}-${warning.kpi_entry_id ?? index}`}>
                <strong>{warning.code}</strong>: {warning.message}
              </div>
            ))}
          </div>
        )}
      </article>

      <article style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Lineage Summary</h2>
        <div>Records: {summary.lineage.length}</div>
        <div>Fields: {DASHBOARD_LINEAGE_FIELD_NAMES.join(", ")}</div>
        {lineagePreview.length === 0 ? (
          <p style={{ marginBottom: 0 }}>No lineage records are available for the current organization summary.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
            {lineagePreview.map((item) => (
              <div key={item.assignment_id}>
                {item.kpi_definition_id} / {item.assignment_id} / {item.scope_type}
              </div>
            ))}
          </div>
        )}
      </article>

      <article style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Contract Meta</h2>
        <div>Contract: {summary.meta.contract_version}</div>
        <div>Phase: {summary.meta.phase_label}</div>
        <div>Release: {summary.meta.release_label}</div>
        <div>Generated: {formatGeneratedAt(summary.meta.generated_at)}</div>
      </article>
    </section>
  );
}

export function DashboardPage() {
  const [state, setState] = useState<DashboardLoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });

      try {
        const response = await fetchOrganizationDashboardSummary();

        if (cancelled) {
          return;
        }

        if (response.success) {
          setState({ status: "ready", summary: response.data });
        } else {
          setState({ status: "error", message: response.error.message });
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Unable to reach the dashboard API." });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return <DashboardView state={state} />;
}
