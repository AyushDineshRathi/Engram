# Engram – Task Board

This file defines atomic development tasks.
Each task must be completed independently and tested.

No large feature implementation without being broken into tasks here.

---

# Phase 0 – Core Domain Contracts

[ ] Implement TypeScript domain models from data-model.md
[ ] Implement Zod schemas for all domain models
[ ] Implement message contract types
[ ] Implement AgentState enum
[ ] Write unit tests for schema validation

# Phase 1 – Extension Foundation

[ ] Setup Vite + TypeScript project
[ ] Configure Manifest V3
[ ] Create background script
[ ] Create content script
[ ] Create popup UI
[ ] Confirm extension loads in Chrome

---

# Phase 2 – Form Extraction Engine

[ ] Implement FormField interface
[ ] Build DOM field detection utility
[ ] Extract labels and context text
[ ] Implement word limit detection
[ ] Write unit tests for field extraction

---

# Phase 3 – Memory Ingestion

[ ] Implement resume upload
[ ] Extract plain text from PDF
[ ] Implement semantic chunking
[ ] Store chunks in IndexedDB
[ ] Write embedding integration
[ ] Implement cosine similarity search

---

# Phase 4 – Intent Classification

[ ] Implement rule-based classifier
[ ] Add tests for intent detection

---

# Phase 5 – Controlled Generation

[ ] Create prompt builder
[ ] Integrate OpenAI API
[ ] Add response validation via Zod
[ ] Implement similarity scoring
[ ] Enforce word limits

---

# Phase 6 – Agent Mode

[ ] Implement AgentState enum
[ ] Implement state transition function
[ ] Implement deterministic field filling
[ ] Implement verification logic
[ ] Add mock portal tests

---

# Future – Migration Strategy

[ ] Define embedding migration plan
[ ] Define versioning strategy for stored data

Tasks must be updated as project evolves.