# Engram – Coding Standards

This document enforces consistent and safe coding practices.

---

# 1. TypeScript Rules

- Strict mode must remain enabled.
- No usage of `any`.
- All exported functions must have explicit return types.
- All interfaces must be declared in `/src/types`.

---

# 2. File Naming

- kebab-case for files
- PascalCase for React components
- camelCase for variables/functions
- UPPER_SNAKE_CASE for constants

---

# 3. Separation of Concerns

Never mix:

- DOM manipulation with AI logic
- Memory retrieval with UI rendering
- State machine logic with React components

Each module must have a single responsibility.

---

# 4. State Machine Discipline

State transitions must:
- Be pure functions
- Avoid side effects
- Be logged internally (without sensitive data)

---

# 5. Error Handling

- No silent failures
- No empty catch blocks
- All async calls must be wrapped in try/catch
- User-visible errors must be sanitized

## IndexedDB Transaction Discipline

All write operations must:
- Be wrapped in explicit Dexie transactions
- Avoid partial writes
- Avoid cross-table writes without transaction boundary

---

# 6. Logging Policy

Allowed:
- Internal debug logs (non-sensitive)

Forbidden:
- Logging resume content
- Logging retrieved memory
- Logging LLM prompts containing user data

---

# 7. AI Safety

All LLM responses must:

1. Be validated using Zod schema
2. Respect token limits
3. Pass similarity threshold check
4. Be truncated deterministically if needed

No raw LLM output may be injected into DOM.

## Deterministic Truncation Policy

If wordLimit is exceeded:

- Hard word-count truncation must be applied.
- No semantic rewriting allowed.
- No additional LLM calls allowed for shortening.

Truncation must be deterministic and repeatable.

---

# 8. Testing Requirements

Each module must include:
- Unit test
- Edge case test

Agent mode requires:
- Simulated DOM test using Playwright

---

# 9. Code Review Rule

Before merging:
- Run all tests
- Manually review diff
- Confirm no architectural drift

---

Violations of these standards must be corrected before merge.