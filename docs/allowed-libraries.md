# Engram – Allowed Libraries

This file defines the ONLY libraries permitted in this project.

No additional libraries may be introduced without updating this file.

---

## Core Frontend

- vite
- typescript
- react
- react-dom

---

## Version Lock Policy

All dependencies must use fixed versions.
Caret (^) and tilde (~) ranges are not allowed.

Dependency upgrades require:
- Update to this file (if relevant)
- Entry in decision-log.md

---

## State Management

- zustand

---

## Styling

- tailwindcss

---

## Validation

- zod

---

## Storage

- dexie (IndexedDB wrapper)

---

## AI / LLM

Cloud Mode:
- openai (official SDK)

Future (Phase 2+):
- @xenova/transformers
- onnxruntime-web

---

## Embedding Model Governance

Embedding model name, version, and dimensionality must be defined in config.

Changing embedding model requires:
- Update to data-model.md
- Migration strategy for existing vectors
- Entry in decision-log.md

---

## Testing

- vitest
- @testing-library/react
- playwright

---

## Utilities

- clsx

---

## Forbidden Categories

- No UI frameworks beyond React
- No heavy backend frameworks
- No ORMs
- No random utility bundles
- No browser automation libraries (like puppeteer)

Browser automation must be implemented manually via DOM APIs.

---

Any proposal to add a dependency must:
1. Justify need
2. Explain architectural impact
3. Be documented in decision-log.md