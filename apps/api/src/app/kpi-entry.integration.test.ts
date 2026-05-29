import { describe, expect, test } from "bun:test";
import { createTestEnvironment, getCookie } from "../test/test-app";

async function loginAs(
  handler: (request: Request) => Promise<Response>,
  env: ReturnType<typeof createTestEnvironment>["env"],
  username: string
) {
  const loginResponse = await handler(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: env.devAuthPassword })
    })
  );

  return {
    sessionCookie: getCookie(loginResponse, env.sessionCookieName)!,
    csrfCookie: getCookie(loginResponse, env.csrfCookieName)!
  };
}

function buildAuthHeaders(
  env: ReturnType<typeof createTestEnvironment>["env"],
  sessionCookie: string,
  csrfCookie?: string
) {
  return {
    "Content-Type": "application/json",
    Cookie: csrfCookie
      ? `${env.sessionCookieName}=${sessionCookie}; ${env.csrfCookieName}=${csrfCookie}`
      : `${env.sessionCookieName}=${sessionCookie}`,
    ...(csrfCookie ? { [env.csrfHeaderName]: csrfCookie } : {})
  };
}

describe("kpi entry integration", () => {
  test("returns entry detail with definition, page, period, value, hierarchy, and history", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie } = await loginAs(handler, env, "viewer.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_org_bed_occupancy_2026_05", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBeTrue();
    expect(body.data.entry.id).toBe("ent_org_bed_occupancy_2026_05");
    expect(body.data.definition.code).toBe("KPI-ORG-001");
    expect(body.data.page.id).toBe("pag_org_hospital");
    expect(body.data.reporting_period.period_key).toBe("2026-05");
    expect(body.data.hierarchy.current_node.hierarchy_level).toBe("organization");
    expect(body.data.value.actual_value).toBe("82");
    expect(body.data.history.length).toBeGreaterThan(0);
    expect(body.data.history[0]).toHaveProperty("summary");
  });

  test("successful value update returns refreshed entry detail and audit history", async () => {
    const { handler, env, db } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          value: {
            actual_value: "12",
            progress_value: 0.75,
            note: "Validated backlog after manual review"
          }
        })
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBeTrue();
    expect(body.data.entry.updated_by).toBe("editor.user");
    expect(body.data.value.actual_value).toBe("12");
    expect(body.data.value.progress_value).toBe(0.75);
    expect(body.data.value.note).toBe("Validated backlog after manual review");
    expect(body.data.history[0].action).toBe("kpi_entry.value_updated");

    const stored = db
      .query(
        `SELECT actual_value, progress_value, note
         FROM entry_values
         WHERE kpi_entry_id = 'ent_empty_value_followup_2026_05'`
      )
      .get() as { actual_value: string; progress_value: number; note: string } | null;

    expect(stored).not.toBeNull();
    expect(stored?.actual_value).toBe("12");
    expect(stored?.progress_value).toBe(0.75);
    expect(stored?.note).toBe("Validated backlog after manual review");
  });

  test("successful status transition returns refreshed detail", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          status: "pending"
        })
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBeTrue();
    expect(body.data.entry.status).toBe("pending");
    expect(body.data.history[0].action).toBe("kpi_entry.status_changed");
  });

  test("successful combined value and status update emits semantic audit", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_dept_interop_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-21T10:00:00Z",
          status: "submitted",
          value: {
            actual_value: "91",
            progress_value: 0.9578,
            note: "Resubmitted after interface validation"
          }
        })
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBeTrue();
    expect(body.data.entry.status).toBe("submitted");
    expect(body.data.value.actual_value).toBe("91");
    expect(body.data.history[0].action).toBe("kpi_entry.submitted");
  });

  test("unauthenticated requests are rejected", async () => {
    const { handler } = createTestEnvironment();

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_org_bed_occupancy_2026_05")
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBeFalse();
    expect(body.error.code).toBe("AUTH_UNAUTHENTICATED");
  });

  test("unauthenticated mutation requests are rejected", async () => {
    const { handler } = createTestEnvironment();

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "csrf-token",
          Cookie: "healthcare_kpi_hub_csrf=csrf-token"
        },
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          value: { actual_value: "11" }
        })
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBeFalse();
    expect(body.error.code).toBe("AUTH_UNAUTHENTICATED");
  });

  test("forbidden read requests are rejected", async () => {
    const { handler, env, db } = createTestEnvironment();
    db.query(
      "DELETE FROM role_permissions WHERE role_code = 'viewer' AND permission_code = 'kpi.read'"
    ).run();

    const { sessionCookie } = await loginAs(handler, env, "viewer.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_org_bed_occupancy_2026_05", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBeFalse();
    expect(body.error.code).toBe("AUTH_FORBIDDEN");
  });

  test("forbidden mutation requests are rejected", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "viewer.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          value: { actual_value: "10" }
        })
      })
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBeFalse();
    expect(body.error.code).toBe("AUTH_FORBIDDEN");
  });

  test("missing entries return not found", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie } = await loginAs(handler, env, "viewer.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_missing", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBeFalse();
    expect(body.error.code).toBe("NOT_FOUND_KPI_ENTRY");
  });

  test("missing entry mutation returns not found", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_missing", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          value: { actual_value: "11" }
        })
      })
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBeFalse();
    expect(body.error.code).toBe("NOT_FOUND_KPI_ENTRY");
  });

  test("entry with no value row and no history returns empty value payload and empty history", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie } = await loginAs(handler, env, "viewer.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBeTrue();
    expect(body.data.value.target_value).toBeNull();
    expect(body.data.value.actual_value).toBeNull();
    expect(body.data.history).toEqual([]);
  });

  test("inactive related definition returns missing context error", async () => {
    const { handler, env, db } = createTestEnvironment();
    db.query("UPDATE kpi_definitions SET is_active = 0 WHERE id = 'kpd_org_bed_occupancy'").run();

    const { sessionCookie } = await loginAs(handler, env, "viewer.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_org_bed_occupancy_2026_05", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBeFalse();
    expect(body.error.code).toBe("NOT_FOUND_KPI_ENTRY_CONTEXT");
  });

  test("mutation with inactive related context returns missing context error", async () => {
    const { handler, env, db } = createTestEnvironment();
    db.query("UPDATE kpi_definitions SET is_active = 0 WHERE id = 'kpd_empty_value_followup'").run();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          value: { actual_value: "11" }
        })
      })
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBeFalse();
    expect(body.error.code).toBe("NOT_FOUND_KPI_ENTRY_CONTEXT");
  });

  test("closed reporting period is rejected", async () => {
    const { handler, env, db } = createTestEnvironment();
    db.query("UPDATE reporting_periods SET status = 'closed' WHERE id = 'rpt_2026_05'").run();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          value: { actual_value: "11" }
        })
      })
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error.code).toBe("CONFLICT_REPORTING_PERIOD_CLOSED");
  });

  test("locked entry is rejected", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_home_visit_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-18T09:00:00Z",
          value: { note: "Attempted update" }
        })
      })
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error.code).toBe("CONFLICT_ENTRY_LOCKED");
  });

  test("stale updated_at returns conflict", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:01Z",
          value: { actual_value: "11" }
        })
      })
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error.code).toBe("CONFLICT_STALE_WRITE");
  });

  test("invalid progress_value is rejected", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          value: { progress_value: 1.5 }
        })
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  test("unknown top-level fields are rejected", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          unexpected: "field",
          value: { actual_value: "11" }
        })
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.details.some((detail: { field: string }) => detail.field === "unexpected")).toBeTrue();
  });

  test("deferred assigned_to field is rejected", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          assigned_to: "manager.user",
          value: { actual_value: "11" }
        })
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.details.some((detail: { field: string }) => detail.field === "assigned_to")).toBeTrue();
  });

  test("deferred due_at field is rejected", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          due_at: "2026-05-30T17:00:00Z",
          value: { actual_value: "11" }
        })
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.details.some((detail: { field: string }) => detail.field === "due_at")).toBeTrue();
  });

  test("deferred value.target_value field is rejected", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          value: {
            actual_value: "11",
            target_value: "20"
          }
        })
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.details.some((detail: { field: string }) => detail.field === "value.target_value")).toBeTrue();
  });

  test("deferred value.extra_json field is rejected", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          value: {
            actual_value: "11",
            extra_json: { ignored: false }
          }
        })
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.details.some((detail: { field: string }) => detail.field === "value.extra_json")).toBeTrue();
  });

  test("invalid status transition is rejected", async () => {
    const { handler, env } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_dept_interop_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-21T10:00:00Z",
          status: "draft"
        })
      })
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error.code).toBe("CONFLICT_INVALID_STATUS_TRANSITION");
  });

  test("audit event is created with semantic payload", async () => {
    const { handler, env, db } = createTestEnvironment();
    const { sessionCookie, csrfCookie } = await loginAs(handler, env, "editor.user");

    const response = await handler(
      new Request("http://localhost/api/kpi-entries/ent_empty_value_followup_2026_05", {
        method: "PATCH",
        headers: buildAuthHeaders(env, sessionCookie, csrfCookie),
        body: JSON.stringify({
          updated_at: "2026-05-24T08:15:00Z",
          status: "pending",
          value: {
            actual_value: "14",
            progress_value: 0.82,
            note: "Prepared for review"
          }
        })
      })
    );

    expect(response.status).toBe(200);
    const auditRow = db
      .query(
        `SELECT action, payload_json
         FROM audit_events
         WHERE entity_type = 'kpi_entry'
           AND entity_id = 'ent_empty_value_followup_2026_05'
         ORDER BY occurred_at DESC
         LIMIT 1`
      )
      .get() as { action: string; payload_json: string } | null;

    expect(auditRow).not.toBeNull();
    expect(auditRow?.action).toBe("kpi_entry.status_changed");
    const payload = JSON.parse(auditRow!.payload_json) as {
      changed_fields: string[];
      old_summary: Record<string, unknown>;
      new_summary: Record<string, unknown>;
    };
    expect(payload.changed_fields).toContain("status");
    expect(payload.changed_fields).toContain("value.actual_value");
    expect(payload.old_summary.status).toBe("draft");
    expect(payload.new_summary.status).toBe("pending");
  });
});
