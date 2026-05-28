# healthcare-kpi-hub SQLite Operations Baseline

**Status**: Draft
**Date**: 2026-05-28
**Owner**: Engineering

---

## 1. Purpose

เอกสารนี้กำหนด operational resilience baseline สำหรับ SQLite ของระบบ

---

## 2. WAL Strategy

- journal mode: `WAL`
- automatic checkpoint policy: prefer periodic checkpointing during low-write windows
- checkpoint cadence baseline: every `1000` WAL pages or controlled maintenance interval, whichever occurs first
- manual recovery expectation: operators may run controlled checkpoint or restart app before restore procedure when WAL growth is abnormal

---

## 3. Busy Timeout Strategy

- configured busy timeout: `5000 ms`
- rationale:
  - เหมาะกับ low-to-moderate contention
  - หลีกเลี่ยง immediate failure จาก short lock overlap

---

## 4. Concurrency Assumptions

- expected concurrent writers: typically `1`, occasionally a few contending writes
- acceptable operational limit: short write transactions only
- application must avoid long-running write transactions, especially in import commit paths

---

## 5. Corruption Recovery

### Detection

- integrity check failure
- SQLite open/read errors suggesting page corruption
- WAL replay failure

### Restore Workflow

1. stop application write traffic
2. capture diagnostics
3. validate latest backup candidate
4. restore backup
5. run integrity check
6. run smoke-test queries
7. reopen application traffic

---

## 6. Backup Verification

- backup cadence baseline: daily minimum
- restore drill cadence baseline: monthly
- verification requirements:
  - integrity check on restored copy
  - ability to read core tables
  - sample auth/navigation/worklist query smoke tests

---

## 7. Failure Modes

### DB Locked

- behavior: request fails gracefully after busy timeout
- action: log lock event, avoid retry storm, inspect long transaction source

### Disk Full

- behavior: write operations fail
- action: stop non-essential writes, alert operations, validate DB state after remediation

### WAL Corruption

- behavior: startup or checkpoint failures
- action: move to restore workflow

### Partial Write

- behavior: mutation transaction should fail atomically
- action: verify integrity and replay safety before reopening writes

### Backup Failure

- behavior: continue service but raise operational alert
- action: do not ignore repeated backup failures

---

## 8. Definition of Done

baseline นี้ถือว่า foundation-ready เมื่อ:

- ทีมมี operational assumptions และ failure-handling baseline สำหรับ SQLite ชัดเจนก่อนเริ่ม implementation ที่แตะ persistence จริง
