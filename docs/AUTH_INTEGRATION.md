# healthcare-kpi-hub Authentication Integration Specification

**Status**: Live Auth Verified Baseline
**Date**: 2026-05-28
**Owner**: Engineering
**Primary References**:
- `docs/API_CONTRACT.md`
- `docs/RBAC_MATRIX.md`
- `docs/DECISIONS.md`

---

## Live Verified State

The baseline in this document has been verified against a live MariaDB upstream as of `2026-05-28`.

- upstream mapping is configuration-driven and not hardcoded in service logic
- the currently verified live mapping is `personnel.username/password/fname/lname`
- the verified password mode is `md5`
- the verified no-active-column behavior uses `MARIADB_ACTIVE_COLUMN=none`
- successful live login provisions a new local SQLite user with default role `viewer`
- `/api/me` and logout/session revocation are verified after live login

---

## 1. Purpose

เอกสารนี้กำหนด authentication, session, และ authorization policy ของ `healthcare-kpi-hub` ในระดับ implementation-ready เพื่อปิด ambiguity ที่สำคัญก่อนเริ่มพัฒนา feature flows ที่พึ่งพา auth อย่างจริงจัง

---

## 2. Finalized Core Decisions

- MariaDB เป็น source of truth สำหรับ credential verification
- SQLite เป็น source of truth สำหรับ local user profile, role assignment, permissions, sessions, และ auth audit
- session-based authentication ใช้ secure cookie เป็น primary client mechanism
- backend เป็น enforcement point ของ authorization
- first-time successful login ได้ default role เป็น `viewer`
- local inactive account block การเข้าใช้แม้ external credential ถูกต้อง
- external inactive account block การเข้าใช้ทันที

---

## 3. Responsibility Boundaries

### MariaDB

- verify username/password
- provide trusted personnel identity fields ที่จำเป็น
- indicate active/inactive external account when available

### SQLite

- persist local user record
- persist roles and permissions
- persist sessions
- persist auth and authorization audit trail

### Backend

- accept login request
- validate input
- rate limit and throttle login attempts
- call MariaDB adapter
- provision/update local user
- create/revoke sessions
- enforce permission checks
- emit auth-related audit events

### Frontend

- submit credentials
- react to authenticated/unauthenticated/forbidden states
- never decide authorization on its own

---

## 4. Authentication Flow

### Login

1. client sends `POST /api/auth/login`
2. backend validates payload
3. backend applies rate-limit and throttle checks
4. backend verifies credentials against MariaDB
5. backend checks external account active state
6. backend provisions or updates local user in SQLite
7. backend checks local account active state
8. backend creates new session record and secure cookie
9. backend emits `auth.login.success`

on failure:

- invalid credentials -> `AUTH_INVALID_CREDENTIALS`
- external inactive -> `AUTH_ACCOUNT_INACTIVE`
- local inactive -> `AUTH_ACCOUNT_INACTIVE`
- upstream unavailable -> `AUTH_UPSTREAM_UNAVAILABLE`
- rate limit -> `AUTH_RATE_LIMITED`

### Logout

1. client calls `POST /api/auth/logout`
2. backend revokes current session
3. backend clears cookie
4. backend emits `auth.logout`

### Session Validation

- protected request must include valid session cookie
- backend resolves hashed token to live session
- expired or revoked session returns `401 AUTH_SESSION_EXPIRED` or `AUTH_UNAUTHENTICATED`

---

## 5. Session Policy

### Absolute Session Lifetime

- `12 hours`

### Idle Timeout

- `2 hours`

### Last Seen Update Policy

- `last_seen_at` may be refreshed at most once every `5 minutes` per session to avoid excessive writes

### Token Rotation Policy

- rotate session token on login
- rotate session token on explicit privilege elevation event
- rotate session token on suspected session theft response
- no background rolling rotation on every request in initial release

### Force Logout Behavior

force logout is triggered when:

- admin changes user role with `force_logout=true`
- admin deactivates local user
- suspicious activity requires session revocation

force logout effect:

- revoke all active sessions for the target user
- next request from revoked session returns `401 AUTH_SESSION_EXPIRED`

### Concurrent Session Policy

- allow up to `3` concurrent active sessions per user
- when creating the 4th session, revoke the oldest active session
- all revocations must be audited

### Session Revocation Flow

1. identify target session or user
2. mark session(s) revoked by deleting or invalidating server-side record
3. emit `auth.session.revoked`
4. if current session was revoked, client is redirected to login on next request

---

## 6. Cookie Policy by Environment

### Common Cookie Attributes

- `HttpOnly=true`
- `Path=/`
- session cookie name is application-defined and consistent across environments

### Local Development

- `Secure=false` only for plain HTTP localhost development
- `SameSite=Lax`

### Staging and Production

- `Secure=true`
- `SameSite=Lax`

### CSRF Strategy

- cookie sessions use `SameSite=Lax`
- all non-GET mutation endpoints must require `X-CSRF-Token`
- CSRF token is generated server-side per session
- frontend reads CSRF token from a dedicated non-HttpOnly response channel such as bootstrap endpoint or response header
- backend validates CSRF token on `POST`, `PUT`, `PATCH`, `DELETE`

---

## 7. Provisioning Ownership

- provisioning is owned by backend auth service
- provisioning happens lazily on successful login
- profile fields sourced from MariaDB may be updated on each successful login
- role assignment is owned by the new app and must not be overwritten by MariaDB-derived data

### Default Role Assignment

- first-time login -> `viewer`

### Inactive External Account Handling

- deny login
- do not create active session
- emit `auth.login.failed.external_inactive`

### Inactive Local Account Handling

- deny login
- do not create active session
- emit `auth.login.failed.local_inactive`

---

## 8. Rate Limit and Throttling Policy

### Per-IP Limit

- maximum `20` login attempts per `15 minutes`

### Per-Username Limit

- maximum `5` failed login attempts per username per `15 minutes`

### Cooldown

- after the username threshold is exceeded, block further login attempts for `15 minutes`

### Response

- return `429 AUTH_RATE_LIMITED`
- do not reveal whether the threshold was IP-based or username-based

all rate-limit blocks must be logged

---

## 9. Authorization Policy

### Roles

- `admin`
- `manager`
- `editor`
- `viewer`

### Permission Resolution

- permissions are resolved from local role assignment in SQLite
- permissions are loaded per authenticated request or from a short-lived server-side cache

### Enforcement Layers

- middleware: session required
- route/controller: permission required
- service layer: business state and resource scope checks

### Business Scope Baseline

- `viewer`: read-only
- `editor`: operational KPI updates only
- `manager`: review/update/read dashboard/audit
- `admin`: full admin and audit access

---

## 10. Upstream Auth Unavailable Policy

when MariaDB auth is unavailable:

- new login attempts fail with `503 AUTH_UPSTREAM_UNAVAILABLE`
- existing valid sessions remain usable until expiry or revocation
- system must log and surface operational diagnostics
- system must not allow offline bypass authentication

---

## 11. Suspicious Activity Handling Baseline

suspicious signals:

- repeated login failures across many usernames from same IP
- repeated revoked-session reuse attempts
- anomalous spike in concurrent sessions for one user

baseline actions:

- emit `auth.suspicious_activity.detected`
- revoke targeted sessions when confidence is sufficient
- require re-login after forced revocation
- log request metadata necessary for investigation without logging secrets

---

## 12. Audit Taxonomy for Auth Events

required auth audit event actions:

- `auth.login.success`
- `auth.login.failed.invalid_credentials`
- `auth.login.failed.external_inactive`
- `auth.login.failed.local_inactive`
- `auth.login.failed.rate_limited`
- `auth.login.failed.upstream_unavailable`
- `auth.logout`
- `auth.session.revoked`
- `auth.role.changed`
- `auth.user.deactivated`
- `auth.user.activated`
- `auth.suspicious_activity.detected`

minimum audit payload fields:

- actor username when available
- target username when available
- reason
- request id
- session id when applicable

---

## 13. API Requirements

### `POST /api/auth/login`

- public
- returns secure cookie and current user summary

### `POST /api/auth/logout`

- authenticated
- revokes current session

### `GET /api/me`

- authenticated
- returns current user, role, permissions

payloads and error shapes are defined in `docs/API_CONTRACT.md`

---

## 14. Security Requirements

- never store plaintext password
- never store plaintext session token
- hash session token before persistence
- mutation requests require valid CSRF token
- auth errors must not leak internal infrastructure details
- local inactive user must always be denied
- backend is the only authorization authority

---

## 15. Definition of Done

auth spec นี้ถือว่า implementation-ready เมื่อ:

- session lifetime, idle timeout, rotation, force logout, concurrent session, CSRF, cookie policy, provisioning, throttling, และ audit taxonomy ถูกปิดครบ
- ไม่มี auth policy สำคัญที่ยังต้อง “ค่อยตัดสินตอน implement”
