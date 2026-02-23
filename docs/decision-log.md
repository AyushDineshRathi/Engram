# Engram – Architectural Decision Log

All major architectural decisions must be recorded here.

---

## All entries must follow:

Decision ID: ADR-XXX
Date:
Context:
Decision:
Consequence:

## 2026-02-XX – Deterministic-First Architecture

Decision:
LLMs will not control browser actions.
All state transitions remain deterministic.

Reason:
Prevents hallucinated automation and unsafe behavior.

---

## 2026-02-XX – Local-First Storage

Decision:
User memory stored in IndexedDB by default.

Reason:
Privacy-first design and reduced infrastructure complexity.

---

## 2026-02-XX – Strict TypeScript Enforcement

Decision:
Enable strict mode with noImplicitAny and noUncheckedIndexedAccess.

Reason:
Prevent structural drift and unsafe assumptions.

## Update Existing Entries
Decision ID: ADR-001
Consequence:
- Clarifies LLM authority boundary.