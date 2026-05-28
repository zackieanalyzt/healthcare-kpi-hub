# healthcare-kpi-hub Audit and Logging Policy

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering

---

## 1. Purpose

เอกสารนี้กำหนด retention, privacy, visibility, redaction, และ structured logging rules ของระบบ

---

## 2. Audit Retention

- active audit retention: `365 days`
- archival expectation: export/archive older audit data if retention beyond 365 days is required by operations policy
- purge rule: purge archived-or-expired audit data only through controlled administrative maintenance process

---

## 3. Sensitive Data Classification

### Must Not Appear In Audit Payload

- passwords
- plaintext session tokens
- CSRF tokens
- raw import file contents
- credential verification payloads

### Must Not Appear In Request Logs

- passwords
- plaintext cookies
- raw authorization headers

### Must Not Appear In Error Logs

- secrets
- full database credentials
- full stack traces in user-facing channels

---

## 4. Visibility Rules

- `audit.read` is required to access audit viewer
- viewer/editor do not get audit visibility by default
- manager visibility may be scoped by business policy later; initial baseline uses permission-based full viewer access within the app
- raw operational logs are not exposed via end-user UI

---

## 5. Redaction Rules

- usernames may be shown in audit where business-relevant
- IPs in technical logs should be truncated or partially masked in user-facing investigative tools
- import payload free text must be summarized, not fully copied into audit payload
- notes/free text fields must not be mirrored wholesale into logs unless explicitly required for diagnostics

---

## 6. Structured Logging Rules

- every request log has `request_id`
- cross-service or async continuation should use `correlation_id` when introduced
- log levels:
  - `DEBUG`
  - `INFO`
  - `WARN`
  - `ERROR`

### Error Categories

- `AUTH`
- `AUTHZ`
- `VALIDATION`
- `IMPORT`
- `DB`
- `INTERNAL`

---

## 7. Incident Investigation Support

retain enough metadata for investigation:

- request_id
- actor username if known
- target entity identifiers
- action codes
- timestamps
- import hash when relevant
- session id or revocation reason when relevant

without retaining:

- secrets
- full raw file payloads
- unnecessary personal free text

---

## 8. Definition of Done

policy นี้ถือว่า foundation-ready เมื่อ:

- ทีมมี baseline เดียวกันว่าอะไร log ได้ อะไร log ไม่ได้
- audit retention/privacy drift ถูกปิดก่อนเริ่ม implementation ของ audit viewer และ structured logging
