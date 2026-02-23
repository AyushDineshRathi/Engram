# Engram – Agent Rules

This document defines the strict operational rules for any code-generating agent
(Codex, Antigravity, or similar) working inside this repository.

These rules are non-negotiable.

---

## 1. Architectural Authority

The `/docs` folder is the single source of truth.

Agents must:
- Read all files inside `/docs` before writing code.
- Follow defined architecture strictly.
- Never override documented decisions.

## 1.1 Document Priority Order

In case of conflict between documents, priority is:

1. architecture.md
2. state-machine.md
3. data-model.md
4. allowed-libraries.md
5. coding-standards.md
6. tasks.md

Lower-priority documents must not override higher-priority specifications.

---

## 2. Folder Structure Constraints

Agents MUST NOT:
- Create new top-level folders.
- Modify root-level structure.
- Introduce backend folders unless explicitly instructed.

Allowed structure is defined in `architecture.md`.

---

## 3. Library Restrictions

Agents may only use libraries listed in:
`docs/allowed-libraries.md`

No additional dependencies may be added without explicit approval.

If a feature cannot be implemented using approved libraries,
the agent must request clarification instead of improvising.

---

## 4. Deterministic-First Policy

Engram is a deterministic-first system.

- LLMs DO NOT control browser actions.
- LLMs DO NOT decide state transitions.
- LLMs ONLY generate text responses.
- All browser automation is controlled by deterministic state machines.

## 4.1 LLM Output Trust Boundary

All LLM outputs are considered untrusted input.

LLM responses must:
- Pass Zod validation
- Be sanitized
- Never be injected directly into DOM
- Never influence state transitions

No raw LLM output may bypass validation layer.

---

## 5. Type Safety Rules

- TypeScript strict mode is enabled.
- No `any` types.
- No implicit return types.
- No untyped JSON parsing.

All LLM outputs must be validated using Zod schemas.

---

## 6. No Placeholder Implementations

Agents must not:
- Add TODO stubs.
- Create mock implementations unless inside `/mocks`.
- Add fake APIs.
- Assume external services exist.

---

## 7. Test-First Development

When implementing new modules:

1. Write test file first (in `/tests`)
2. Then implement feature
3. Ensure tests pass

No feature should exist without tests.

---

## 8. No Silent Architectural Drift

If a requested feature contradicts:
- architecture.md
- data-model.md
- state-machine.md

The agent must halt and request clarification.

---

## 9. Security Boundaries

Agents must not:
- Store unencrypted sensitive data
- Log personal user data
- Expose memory contents to console

Privacy is core to Engram.

---

## 10. Single Responsibility Rule

Every file should:
- Have one responsibility
- Avoid mixing DOM logic with AI logic
- Avoid mixing memory layer with UI layer

---

Failure to follow these rules invalidates the implementation.