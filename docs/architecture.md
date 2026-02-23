# Engram – System Architecture

Engram is a Chrome Extension that provides semantic form autofill
powered by a personal memory retrieval system.

The architecture is deterministic-first and modular.

---

# 1. High-Level Overview

Engram consists of four primary layers:

1. Chrome Extension Layer
2. Agent Orchestration Layer
3. Personal Memory Layer
4. AI Generation Layer

LLMs are isolated to text generation only.

---

# 2. Folder Structure
ENGRAM
├── config
├── docs
│   ├── agent-rules.md
│   ├── allowed-libraries.md
│   ├── architecture.md
│   ├── coding-standards.md
│   ├── data-model.md
│   ├── state-machine.md
│   ├── tasks.md
│   ├── decision-log.md
├── mocks
├── public
├── scripts
├── src
│   ├── types
│   ├── constants
├── tests
├── package.json
├── tsconfig.json
├── .editorconfig
├── .gitignore
├── README.md


No additional top-level folders are allowed.

---

# 3. Extension Components

## 3.1 Content Script

Responsibilities:
- Detect forms
- Extract field metadata
- Inject UI highlights
- Communicate with background

Must not:
- Call LLM directly
- Perform memory retrieval

---

## 3.2 Background Script

Responsibilities:
- Orchestrate state machine
- Call AI APIs
- Manage memory retrieval
- Coordinate agent mode

All content-background communication must use typed message contracts
defined in /src/types/messages.ts

---

## 3.3 Popup UI

Responsibilities:
- User onboarding
- Resume upload
- Toggle modes (Manual / Agent Mode)
- Privacy settings

---

## 3.4 Messaging Contracts

All content-background communication must use strictly typed
message contracts defined in:

/src/types/messages.ts

No untyped postMessage or runtime message passing is allowed.

--- 

# 4. Agent Mode Architecture

Agent Mode uses a deterministic state machine.

States (defined formally in state-machine.md):
- OBSERVE
- EXTRACT_FIELDS
- PLAN
- FILL
- VERIFY
- NEXT_PAGE
- COMPLETE

Transitions are rule-based.
LLM cannot alter transitions.

---

# 5. Memory Layer

Located in `/src/memory`

Components:
- Document ingestion
- Chunking
- Embedding generation
- Vector search
- Metadata storage

Storage:
- IndexedDB via Dexie

---

# 6. AI Layer

Located in `/src/models`

Responsibilities:
- Intent classification
- Prompt construction
- Response validation

All LLM outputs must:
- Pass Zod schema validation
- Respect word limits
- Be grounded in retrieved memory

---

# 7. Security Model

- Data stored locally by default
- No memory logs in console
- No automatic cloud sync
- Explicit per-site permissions

---

# 8. Deterministic Principle

The following must always be deterministic:
- DOM selection
- Field detection
- State transitions
- Memory retrieval

Only narrative generation may use probabilistic AI.

---

This architecture must not be modified without
updating this file and logging the decision.