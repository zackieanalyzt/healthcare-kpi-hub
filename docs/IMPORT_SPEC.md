# healthcare-kpi-hub Import Specification

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering
**Primary References**:
- `docs/DOMAIN_MODEL.md`
- `docs/API_CONTRACT.md`
- `docs/SQLITE_SCHEMA.md`
- `docs/SQLITE_OPERATIONS.md`

---

## 1. Purpose

เอกสารนี้กำหนด import architecture ของระบบให้เป็น controlled ingestion flow ไม่ใช่แค่การ parse file และต้องรองรับ replay-safe behavior, duplicate detection, และ operational diagnostics ที่เพียงพอ

---

## 2. Supported Formats

- `.csv`
- `.xlsx`

not supported in initial release:

- `.xls`
- `.ods`
- `.json`

---

## 3. File Constraints

### Allowed MIME Types

- `text/csv`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### File Size Limits

- CSV: maximum `10 MB`
- XLSX: maximum `20 MB`

### Row Limits

- maximum `10,000` rows per file

files ที่เกินข้อจำกัดต้องถูก reject ก่อน parse

---

## 4. Security Controls

- reject unsupported MIME types
- reject oversized files
- sanitize filename for storage/display
- do not execute formulas
- neutralize spreadsheet formula injection by treating imported values as data only
- reject malformed spreadsheets that fail parser integrity checks
- scan header and data fields for unexpected control characters when relevant

formula injection protection:

- หากค่าขึ้นต้นด้วย `=`, `+`, `-`, `@` ต้อง treat เป็น raw text input เท่านั้น
- ห้าม evaluate formula
- export flows ในอนาคตต้อง escape ค่ากลุ่มนี้อย่าง explicit

---

## 5. File Fingerprinting

- every uploaded file must receive a SHA-256 content hash
- the SHA-256 hash is the canonical duplicate/replay detection key in initial release
- future normalized content fingerprinting may be added for CSV normalization edge cases, but raw-content SHA-256 is the minimum baseline

---

## 6. Import Lifecycle

states:

- `uploaded`
- `parsed`
- `validated`
- `ready_to_commit`
- `committed`
- `failed`

state transitions:

- `uploaded -> parsed`
- `parsed -> validated`
- `validated -> ready_to_commit`
- `validated -> failed`
- `ready_to_commit -> committed`
- `ready_to_commit -> failed`

---

## 7. Parse Flow

1. upload file
2. verify MIME type and size
3. compute file hash
4. persist import job metadata
5. parse file
6. detect header row
7. normalize row values
8. map columns to supported import fields
9. collect parse issues

parse outcome:

- success with normalized preview rows
- failed with parse-level issues

---

## 8. Validation Stages

### Stage 1: File-Level Validation

- supported format
- size limit
- row limit
- readable workbook or CSV encoding

### Stage 2: Structure Validation

- required headers present
- no duplicate headers in required field set
- supported column mapping only

### Stage 3: Row-Level Validation

- required fields present
- period key format valid
- KPI identifiers resolve to known definitions
- values conform to preset/value type rules
- status fields valid when allowed

### Stage 4: Domain Validation

- target reporting period exists and is open
- target KPIEntry is creatable or updatable by import policy
- inactive definitions/pages are not accepted for new updates unless explicitly allowed by policy

---

## 9. Preview Behavior

preview ต้องแสดง:

- total rows
- valid rows
- invalid rows
- warnings
- row-level issues
- sample normalized rows

preview must not mutate domain state

users ต้องเห็นผล validation ก่อน commit เสมอ

---

## 10. Commit Behavior

commit rules:

- commit ได้เฉพาะ job ที่อยู่สถานะ `ready_to_commit`
- commit ต้องเป็น transactional ในระดับ domain state เท่าที่ implementation รองรับ
- ถ้าเกิด fatal error ระหว่าง commit ต้องไม่ทิ้ง silent partial state

domain effects:

- create KPIEntry หาก policy อนุญาตและยังไม่มี entry สำหรับ definition+period
- update KPIEntry/EntryValue หากมี entry อยู่แล้ว
- create audit event สำหรับ import commit
- update ImportJob summary

### Commit Idempotency

- repeated commit request for a successfully committed `job_id` must return the existing committed result and must not reapply domain mutations
- if client retries after network timeout, backend must resolve based on persisted import job state
- duplicate commit attempts must be logged

---

## 11. Duplicate Handling

duplicate definition:

- แถวที่ชี้ไป definition+period เดียวกันในไฟล์เดียวกันถือว่า invalid duplicate เว้นแต่ policy กำหนดชัดเจนให้ row หลัง override row แรก

initial policy:

- reject duplicate rows ภายในไฟล์เดียวกัน

existing system record:

- ถ้ามี KPIEntry อยู่แล้ว ให้ treat เป็น update candidate
- ถ้าไม่มี ให้ treat เป็น create candidate ตาม policy

### Duplicate Upload Handling

- same file uploaded twice with identical SHA-256 hash and same uploader inside the replay detection window must be flagged as duplicate content
- same content with different filename still counts as duplicate upload
- system may return the existing job reference or explicit duplicate warning, but must not silently create multiple active commit candidates for the same content

---

## 12. Partial Failure Handling

- parse failure ระดับไฟล์: job = `failed`
- validation failure ระดับบางแถว: job ยัง preview ได้ แต่ไม่พร้อม commit จนกว่าประเด็น critical จะถูกแก้
- commit failure ระดับ transaction: job = `failed`, no silent success

initial commit policy:

- all-or-nothing for critical row errors
- rows ที่เป็น warning อย่างเดียว commit ได้

---

## 13. Rollback Expectations

- หาก commit ล้มเหลวก่อน transactional boundary เสร็จสมบูรณ์ ต้อง rollback domain changes
- หาก implementation layer จำกัด rollback เต็มรูปแบบ ต้องไม่เปิดใช้งาน commit จนกว่าพฤติกรรม transaction จะรับรองได้
- rollback events ต้องถูก log

---

## 14. Allowed Import Fields

ขั้นต่ำที่รองรับ:

- `period_key`
- `kpi_code`
- `page_code`
- `target_value`
- `actual_value`
- `progress_value`
- `note`
- `assigned_to`
- `due_at`
- `status`

field mapping ต้องเป็น explicit mapping ไม่ใช้ heuristic ที่เดาเองเกินจำเป็น

---

## 15. Audit Behavior

ต้องสร้าง audit events อย่างน้อยสำหรับ:

- import uploaded
- import validation failed
- import committed
- import commit rejected

audit payload ควรมี:

- import job id
- source filename
- file hash
- total rows
- valid rows
- invalid rows
- created entries count
- updated entries count

---

## 16. Import Replay Policy

- preview requests can be replayed safely
- upload of identical content is replay-detected and must not be treated as fresh business intent by default
- commit may be retried safely for the same `job_id`
- committed job must not reapply mutations on replay
- failed job commit replay must be blocked

---

## 17. Operational Diagnostics

must log:

- import job id
- uploader identity
- source filename
- file hash
- replay detection outcome
- duplicate upload outcome
- duplicate commit attempts
- commit result summary

---

## 18. Malformed Spreadsheet Handling

malformed spreadsheet examples:

- unreadable workbook structure
- broken shared strings
- unsupported sheet layout
- missing required headers

behavior:

- reject file
- set job status `failed`
- return parse-safe error message
- log technical diagnostics separately from user message

---

## 19. Definition of Done

import spec นี้ถือว่า implementation-ready เมื่อ:

- file limits, formats, security checks, validation stages, preview, commit, duplicate policy, rollback expectations, idempotency, และ replay safety ถูกระบุครบ
- ทีม backend และ frontend สามารถ implement import wizard และ import pipeline ได้โดยไม่เดา policy เอง
