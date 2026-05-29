# Pilot Defect Template

Use this template for each defect discovered during controlled pilot rehearsal.

Defect ID format:

- `PILOT-001`, `PILOT-002`, `PILOT-003`, and so on
- use a three-digit running number
- do not reuse an old defect ID
- use one defect record per distinct defect
- do not open a defect for a pure suggestion or future feature request unless it affects workflow safety or pilot comprehension

Examples:

- `PILOT-001: R-10 stale-write message is unclear for editor user`
- `PILOT-002: R-13 audit history wording is misleading`

## Defect Header

| Field | Value |
|---|---|
| Defect ID | |
| Scenario ID | `R-01` to `R-14` |
| Reporter | |
| Role used | `viewer` / `editor` / `manager` / `admin` |
| Environment | |
| Browser | |
| Date reported | |

## Summary

Short title:

-

Short description:

-

## Steps To Reproduce

1.
2.
3.

## Expected Result

-

## Actual Result

-

## Screenshot / Evidence

- screenshot path:
- video path:
- log or note:

Privacy note:

- do not record passwords
- do not record session tokens
- do not record real patient data
- do not include more personal information than necessary
- mask or redact sensitive content before sharing screenshots

## Severity

Choose one:

- `S1 blocker`
- `S2 major`
- `S3 minor`
- `S4 observation`

## Suspected Area

Choose one:

- `auth/session`
- `RBAC`
- `navigation`
- `worklist`
- `KPI page`
- `KPI entry detail`
- `mutation`
- `stale-write/concurrency`
- `audit history`
- `Thai/English message`
- `data seed`
- `other`

## Triage Decision

Choose one:

- `fix before pilot`
- `fix after pilot`
- `documentation only`
- `not a defect`
- `needs design decision`

## Resolution Note

-
