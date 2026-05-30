import {
  DASHBOARD_AGGREGATION_METHOD,
  DASHBOARD_API,
  DASHBOARD_MEASUREMENT_TYPE,
  DASHBOARD_RISK_STATUS,
  DASHBOARD_SCOPES,
  DASHBOARD_SUMMARY_CARD_LABELS,
  DASHBOARD_TARGET_DIRECTION,
  DASHBOARD_TARGET_OPERATOR
} from "@healthcare-kpi-hub/config";
import { describe, expect, test } from "bun:test";
import { createTestEnvironment, getCookie } from "../test/test-app";

describe("dashboard summary integration", () => {
  test("returns a read-only organization summary for a dashboard reader", async () => {
    const { handler, env, db } = createTestEnvironment();
    db.query(
      `UPDATE kpi_definitions
       SET measurement_type = ?2,
           measurement_unit = '%',
           target_operator = ?3,
           target_value = '80',
           target_direction = ?4,
           target_annotation = 'Maintain KPI performance at 80 percent.',
           aggregation_method = ?5,
           threshold_rules = ?6,
           updated_at = ?7
       WHERE id = ?1`
    ).run(
      "kpd_org_bed_occupancy",
      DASHBOARD_MEASUREMENT_TYPE.PERCENTAGE,
      DASHBOARD_TARGET_OPERATOR.GTE,
      DASHBOARD_TARGET_DIRECTION.HIGHER_IS_BETTER,
      DASHBOARD_AGGREGATION_METHOD.LATEST_VALUE,
      JSON.stringify({
        bands: [
          {
            status: DASHBOARD_RISK_STATUS.WATCH,
            operator: DASHBOARD_TARGET_OPERATOR.GTE,
            value: 80
          }
        ]
      }),
      new Date().toISOString()
    );

    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

    const response = await handler(
      new Request(`http://localhost${DASHBOARD_API.summaryPath}?scope=${DASHBOARD_SCOPES.ORGANIZATION}`, {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBeTrue();
    expect(body.data.scope.type).toBe(DASHBOARD_SCOPES.ORGANIZATION);
    expect(body.data.summary_cards.some((card: { label: string }) => card.label === DASHBOARD_SUMMARY_CARD_LABELS.total)).toBeTrue();
    expect(Array.isArray(body.data.warnings)).toBeTrue();
    expect(Array.isArray(body.data.lineage)).toBeTrue();
  });

  test("forbids access when the role lacks dashboard.read", async () => {
    const { handler, env } = createTestEnvironment();
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "editor.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

    const response = await handler(
      new Request(`http://localhost${DASHBOARD_API.summaryPath}?scope=${DASHBOARD_SCOPES.ORGANIZATION}`, {
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

  test("rejects unsupported scope values", async () => {
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
      new Request(`http://localhost${DASHBOARD_API.summaryPath}?scope=department`, {
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBeFalse();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  test("does not expose write behavior on the organization summary endpoint", async () => {
    const { handler, env, db } = createTestEnvironment();
    const beforeCount = db.query("SELECT COUNT(*) AS count FROM kpi_entries").get() as { count: number };
    const loginResponse = await handler(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "viewer.user", password: env.devAuthPassword })
      })
    );
    const sessionCookie = getCookie(loginResponse, env.sessionCookieName)!;

    const response = await handler(
      new Request(`http://localhost${DASHBOARD_API.summaryPath}?scope=${DASHBOARD_SCOPES.ORGANIZATION}`, {
        method: "POST",
        headers: {
          Cookie: `${env.sessionCookieName}=${sessionCookie}`
        }
      })
    );
    const afterCount = db.query("SELECT COUNT(*) AS count FROM kpi_entries").get() as { count: number };

    expect(response.status).toBe(403);
    expect(afterCount.count).toBe(beforeCount.count);
  });
});
