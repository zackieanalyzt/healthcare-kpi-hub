import { describe, expect, test } from "bun:test";
import { createTestEnvironment, getCookie } from "../test/test-app";

describe("kpi page integration", () => {
  test("returns hierarchy-aware KPI page detail for an authenticated user", async () => {
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
      new Request("http://localhost/api/kpi-pages/pag_dept_digital_health", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBeTrue();
    expect(body.data.page.id).toBe("pag_dept_digital_health");
    expect(body.data.hierarchy.current_node.hierarchy_level).toBe("department");
    expect(body.data.hierarchy.parent_node?.page_id).toBe("pag_org_hospital");
    expect(body.data.hierarchy.child_nodes.some((node: { page_id: string }) => node.page_id === "pag_unit_bi_team")).toBeTrue();
    expect(body.data.assigned_kpis.length).toBeGreaterThan(0);
  });

  test("unauthenticated requests are rejected", async () => {
    const { handler } = createTestEnvironment();

    const response = await handler(
      new Request("http://localhost/api/kpi-pages/pag_org_hospital")
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBeFalse();
    expect(body.error.code).toBe("AUTH_UNAUTHENTICATED");
  });

  test("forbidden access is enforced when the role lacks kpi.read", async () => {
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
      new Request("http://localhost/api/kpi-pages/pag_org_hospital", {
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

  test("missing pages return not found", async () => {
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
      new Request("http://localhost/api/kpi-pages/pag_missing", {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBeFalse();
    expect(body.error.code).toBe("NOT_FOUND_KPI_PAGE");
  });
});
