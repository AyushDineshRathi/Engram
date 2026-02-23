# Engram – Agent State Machine Specification

This document defines the deterministic state machine
that powers Agent Mode.

LLMs have zero authority over state transitions.

---

# 1. Design Principles

1. All transitions are rule-based.
2. No dynamic state creation.
3. All side effects are explicit.
4. No silent failures.

---

# 2. States Overview
IDLE → OBSERVE → EXTRACT_FIELDS → PLAN → FILL → VERIFY → NEXT_PAGE → COMPLETE
↓
ERROR

---

# 3. State Definitions

## IDLE

Agent inactive.
No DOM interaction allowed.

Transition:
- On user activation → OBSERVE

---

## OBSERVE

Purpose:
- Confirm page stability
- Ensure DOM is loaded

Transition:
- If DOM ready → EXTRACT_FIELDS
- If timeout → ERROR

---

## EXTRACT_FIELDS

Purpose:
- Detect all supported form fields
- Generate FormField[] array

Transition:
- If no fields found → COMPLETE
- Else → PLAN

---

## PLAN

Purpose:
- Determine filling order
- Filter unsupported fields

Transition:
- If fields available → FILL
- Else → COMPLETE

---

## FILL

Purpose:
- Focus target field
- Request generation
- Insert value deterministically

Transition:
- On success → VERIFY
- On failure → ERROR

---

## VERIFY

Purpose:
- Confirm value persisted
- Confirm no validation error

Transition:
- If valid and more fields remain → FILL
- If last field → NEXT_PAGE
If validation fails:
- Retry once (deterministically)
- If still failing → ERROR

---

## NEXT_PAGE

Purpose:
- Detect multi-step forms
- Navigate forward if safe

Transition:
- If new page detected → OBSERVE
- Else → COMPLETE

---

## COMPLETE

Purpose:
- End agent session
- Clean up state

---

## ERROR

Purpose:
- Log deterministic error
- Halt execution safely

Recovery must require user interaction.

---

# 4. Transition Rules

- No backward transitions except ERROR.
- No state skipping.
- Each transition must be logged internally.
- State changes must be pure functions.

## Retry Constraints

- maxRetriesPerField must be defined in config.
- Retry count must be tracked in AgentContext.
- Retry logic must be deterministic.
- No infinite retry loops allowed.

---

# 5. LLM Boundary

LLM may:
- Generate text content only.

LLM may NOT:
- Trigger state changes.
- Click buttons.
- Decide navigation.

---

This state machine is immutable without formal architectural revision.