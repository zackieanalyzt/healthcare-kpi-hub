# Pilot Tester Brief

**Audience**: Small internal tester group for controlled pilot rehearsal
**Status**: `brief for controlled pilot rehearsal only`

## 1. What This System Is For

`healthcare-kpi-hub` is an operational KPI management system for healthcare work. In this round, the focus is not dashboards. The focus is whether users can move through the current KPI workflow clearly and safely.

The current workflow is:

- login
- open navigation and worklist
- open KPI page
- open KPI entry
- update approved fields where allowed
- understand audit history and error messages

## 2. What We Want Testers To Try

We want testers to check whether the current workflow is understandable and usable:

- can you understand the worklist and find the right KPI?
- can you open a KPI entry and understand what it belongs to?
- can approved updates be completed clearly?
- do status changes make sense?
- do error messages tell you what happened?
- does audit history help explain who changed what?
- is the stale-write message understandable?

## 3. What Is Not In Scope In This Round

Please do not judge this rehearsal by features that are intentionally deferred:

- dashboard or aggregation
- import workflow
- assignment editing
- due date editing
- advanced permission model
- broader workflow redesign

If you want those features later, that is still useful feedback, but they are not the subject of this test round.

## 4. Roles Used In Testing

The current test roles are:

- `viewer`
- `editor`
- `manager`
- `admin`

Current expectation:

- `viewer` can read but not edit
- `editor` can update approved KPI fields
- `manager` currently behaves like `editor` for the same conservative mutation scope
- `admin` can also update within the same current conservative scope

## 5. What To Observe

Please pay special attention to these questions:

- do you understand the worklist?
- can you find the KPI you are looking for?
- when you open a KPI entry, do you understand the page, period, and current status?
- is it easy enough to update `actual`, `progress`, `note`, or `status` where allowed?
- are error messages clear?
- does audit history help explain what happened?
- if another session changes the same entry first, is the stale-write message understandable?

## 6. How To Report Feedback

You can report feedback in two main ways:

- `defect`
  - something is broken, misleading, unsafe, or blocks the intended workflow
- `suggestion`
  - the workflow still works, but wording, layout, or usability could improve

The facilitator may ask for:

- a screenshot
- the scenario ID such as `R-03` or `R-10`
- the role you were using
- what you expected
- what actually happened

## 7. How To Separate Defect From Suggestion

Treat it as a `defect` when:

- you cannot complete the intended flow
- the system allows something it should forbid
- a valid save fails unexpectedly
- a message is so unclear that the workflow becomes unsafe or misleading
- audit history fails to explain a meaningful change

Treat it as a `suggestion` when:

- the task still works but wording could be better
- layout could be clearer
- the workflow needs training or a tooltip
- you want a future feature that is not part of this round

## 8. Scope Reminder

This rehearsal is only for the current conservative KPI workflow.

It is not a dashboard review.
It is not an import review.
It is not an assignment or due date workflow review.

Feature expansion will be considered only after the team reviews the pilot feedback formally.
