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

---

Decision ID: ADR-002
Date: 2026-02-24
Context:
- Form extraction was over-detecting unrelated controls and missing target job-application controls.
- SPA re-renders and dynamic mounts caused repeated extraction churn.
Decision:
- Adopt deterministic primary-container selection based on structural DOM signals:
  - control density
  - text-like control count
  - submit presence
  - form semantics
  - excluded regions
- Scope extraction to the selected container only.
- Add deterministic extraction dedupe/stability checks and observer stop conditions after stable detection.
Consequence:
- Reduced false positives from header/search/cookie regions.
- Improved extraction stability on SPA portals.
- Deterministic behavior preserved with no AI usage in DOM extraction.

---

Decision ID: ADR-003
Date: 2026-02-24
Context:
- Job portals often render application forms in iframes; source manifest config did not persist frame-wide content injection.
Decision:
- Enable `all_frames: true` in source manifest (`public/manifest.json`) for content script injection.
Consequence:
- Extraction runs in child frames and top frame consistently after build output regeneration.

---

Decision ID: ADR-004
Date: 2026-02-24
Context:
- Required-field and field-type detection had incorrect outcomes on modern portal DOM patterns.
Decision:
- Implement deterministic required detection using DOM-only signals:
  - `required` attribute
  - `aria-required`
  - `data-required`
  - associated-label marker `*`
  - radio-group required propagation by shared `name`
  - `aria-invalid` + empty-value fallback
- Implement deterministic type mapping using role/tag/`input.type`/`contenteditable`, with role-first precedence.
- Keep file inputs represented as `FieldType = "Text"` to preserve current data model constraints.
Consequence:
- Improved required/type accuracy without portal-specific rules, heuristics, or schema drift.
