import { describe, expect, test } from "bun:test";
import { createTestEnvironment, getCookie } from "../test/test-app";

describe("kpi entry integration", () => {
  test("returns entry detail with definition, page, period, value, hierarchy, and history", async () => {
    const { handler, env } = createTestEnvironment();
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

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

  test("forbidden requests are rejected", async () => {
    const { handler, env, db } = createTestEnvironment();
    db.query(
      "DELETE FROM role_permissions WHERE role_code = 'viewer' AND permission_code = 'kpi.read'"
    ).run();

    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

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

  test("missing entries return not found", async () => {
    const { handler, env } = createTestEnvironment();
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

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

  test("entry with no value row and no history returns empty value payload and empty history", async () => {
    const { handler, env } = createTestEnvironment();
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

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

    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

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
});
