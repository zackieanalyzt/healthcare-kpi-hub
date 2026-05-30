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

const subtleTextStyle = {
  color: "#4b5563"
} as const;

const sectionHeaderStyle = {
  marginTop: 0,
  marginBottom: "0.75rem"
} as const;

export function DashboardView({ state }: { state: DashboardLoadState }) {
  if (state.status === "loading") {
    return (
      <section aria-labelledby="dashboard-title" style={{ display: "grid", gap: "1rem" }}>
        <h1 id="dashboard-title">Organization Dashboard</h1>
        <article aria-live="polite" style={panelStyle}>
          <h2 style={sectionHeaderStyle}>Loading</h2>
          <p style={{ margin: 0 }}>Loading organization dashboard...</p>
        </article>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section aria-labelledby="dashboard-title" style={{ display: "grid", gap: "1rem" }}>
        <h1 id="dashboard-title">Organization Dashboard</h1>
        <article role="alert" style={panelStyle}>
          <h2 style={sectionHeaderStyle}>Unable to Load Dashboard</h2>
          <p style={{ margin: 0 }}>Dashboard error: {state.message}</p>
        </article>
      </section>
    );
  }

  const { summary } = state;
  const lineagePreview = summary.lineage.slice(0, 3);

  return (
    <section aria-labelledby="dashboard-title" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 id="dashboard-title" style={{ marginBottom: "0.25rem" }}>Organization Dashboard</h1>
        <p style={{ margin: 0, ...subtleTextStyle }}>
          {summary.scope.name} / Period {summary.period.key} / Status {summary.period.status}
        </p>
      </header>

      <div
        aria-label="Organization KPI summary cards"
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))"
        }}
      >
        {summary.summary_cards.map((card) => (
          <article key={card.code} aria-label={`${card.label}: ${card.value}`} style={panelStyle}>
            <div style={{ ...subtleTextStyle, fontSize: "0.9rem" }}>{card.label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{card.value}</div>
          </article>
        ))}
      </div>

      {isEmptyDashboard(summary) ? (
        <article aria-labelledby="dashboard-empty-title" style={panelStyle}>
          <h2 id="dashboard-empty-title" style={sectionHeaderStyle}>No Operational KPI Yet</h2>
          <p style={{ margin: 0 }}>No operational KPI is included in the organization summary yet.</p>
        </article>
      ) : null}

      <article aria-labelledby="achievement-title" style={panelStyle}>
        <h2 id="achievement-title" style={sectionHeaderStyle}>Achievement Summary</h2>
        <dl style={{ display: "grid", gap: "0.5rem", margin: 0, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          <div>
            <dt style={subtleTextStyle}>Numerator</dt>
            <dd style={{ margin: 0, fontWeight: 700 }}>{summary.achievement.numerator}</dd>
          </div>
          <div>
            <dt style={subtleTextStyle}>Denominator</dt>
            <dd style={{ margin: 0, fontWeight: 700 }}>{summary.achievement.denominator}</dd>
          </div>
          <div>
            <dt style={subtleTextStyle}>Achievement</dt>
            <dd style={{ margin: 0, fontWeight: 700 }}>{summary.achievement.percent}%</dd>
          </div>
        </dl>
      </article>

      <article aria-labelledby="warnings-title" style={panelStyle}>
        <h2 id="warnings-title" style={sectionHeaderStyle}>Data Quality Warnings</h2>
        {summary.warnings.length === 0 ? (
          <p style={{ margin: 0 }}>No dashboard data quality warnings.</p>
        ) : (
          <div role="list" style={{ display: "grid", gap: "0.5rem" }}>
            {summary.warnings.map((warning, index) => (
              <div key={`${warning.code}-${warning.kpi_entry_id ?? index}`} role="listitem">
                <strong>{warning.code}</strong>
                <div>{warning.message}</div>
                <div style={{ ...subtleTextStyle, fontSize: "0.9rem" }}>
                  KPI: {warning.kpi_definition_id ?? "-"} / Entry: {warning.kpi_entry_id ?? "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article aria-labelledby="lineage-title" style={panelStyle}>
        <h2 id="lineage-title" style={sectionHeaderStyle}>Lineage Summary</h2>
        <div>Records: {summary.lineage.length}</div>
        <details style={{ marginTop: "0.5rem" }}>
          <summary>Lineage fields</summary>
          <div style={{ marginTop: "0.5rem", ...subtleTextStyle }}>{DASHBOARD_LINEAGE_FIELD_NAMES.join(", ")}</div>
        </details>
        {lineagePreview.length === 0 ? (
          <p style={{ marginBottom: 0 }}>No lineage records are available for the current organization summary.</p>
        ) : (
          <div role="list" style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
            {lineagePreview.map((item) => (
              <div key={item.assignment_id} role="listitem">
                {item.kpi_definition_id} / {item.assignment_id} / {item.scope_type}
              </div>
            ))}
          </div>
        )}
      </article>

      <article aria-labelledby="meta-title" style={panelStyle}>
        <h2 id="meta-title" style={sectionHeaderStyle}>Contract Meta</h2>
        <dl style={{ display: "grid", gap: "0.5rem", margin: 0 }}>
          <div>
            <dt style={subtleTextStyle}>Contract</dt>
            <dd style={{ margin: 0 }}>{summary.meta.contract_version}</dd>
          </div>
          <div>
            <dt style={subtleTextStyle}>Phase</dt>
            <dd style={{ margin: 0 }}>{summary.meta.phase_label}</dd>
          </div>
          <div>
            <dt style={subtleTextStyle}>Release</dt>
            <dd style={{ margin: 0 }}>{summary.meta.release_label}</dd>
          </div>
          <div>
            <dt style={subtleTextStyle}>Generated</dt>
            <dd style={{ margin: 0 }}>{formatGeneratedAt(summary.meta.generated_at)}</dd>
          </div>
        </dl>
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
