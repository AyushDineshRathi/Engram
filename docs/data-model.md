# Engram – Data Model Specification

This document defines the structural contracts of Engram.

These models represent:
- Extracted form data
- User memory data
- Retrieval results
- Generation inputs and outputs
- Agent execution context

This document does NOT define configuration constants.
Configuration is defined separately.

All structural changes must update this file before implementation.

---

# 1. Form Domain Models

These models represent extracted webpage form elements.

## 1.1 FieldType

Represents supported input categories.

Allowed values are strictly enumerated.
- Text
- Textarea
- Select
- Radio
- Checkbox
- Richtext


No dynamic extension allowed without architectural revision.

---

## 1.2 FormField

Represents a single extracted form field.

Required properties:

- id: Deterministic unique identifier derived from DOM path
- type: FieldType
- label: Visible human-readable label
- contextText: Nearby contextual content (section headers, helper text)
- required: Whether field is mandatory
- selector: Deterministic DOM selector for interaction

Optional properties:

- placeholder
- wordLimit

Constraints:

- id must be stable across multiple scans.
- selector must uniquely identify element.
- wordLimit must be parsed deterministically (never guessed by LLM).

---

# 2. Intent Domain Model

## 2.1 FieldIntent

Represents semantic classification of a form field.

Allowed values:

- BASIC_INFO
- TECHNICAL_EXPERIENCE
- BEHAVIORAL_STORY
- MOTIVATION
- DOMAIN_MATCH
- LEADERSHIP
- SHORT_ANSWER
- UNKNOWN

Intent classification must always return one of these values.

No free-text intent allowed.

---

# 3. Memory Domain Models

These represent user-uploaded career memory.

## 3.1 MemoryDocument

Represents a full uploaded source such as resume or SOP.

Properties:

- id: Unique identifier
- source: resume | sop | portfolio | github
- createdAt: Timestamp

---

## 3.2 MemoryChunk

Represents a semantic unit derived from a document.

Properties:

- id: Unique identifier
- documentId: Parent document reference
- text: Raw chunk text
- embedding: Fixed-length numeric vector
- tags: Skill or domain tags
- createdAt: Timestamp

Constraints:

- Embedding dimensionality must remain constant.
- Chunk size must respect system token limit.
- Embeddings must be generated deterministically using configured model.

---

## 3.3 RetrievalResult

Represents result of vector similarity search.

Properties:

- chunkId
- score (normalized between 0 and 1)
- text

Constraints:

- score must be computed deterministically.
- Results must be ordered by descending similarity.

--- 

## 3.4 EmbeddingConfig

Represents embedding system metadata.

Properties:

- modelName
- version
- dimension

Constraints:

- dimension must match stored MemoryChunk.embedding length.
- Changing configuration requires architectural revision.
---

# 4. Generation Domain Models

## 4.1 GenerationRequest

Represents input to the AI generation layer.

Includes:

- FormField
- FieldIntent
- Retrieved context (array of RetrievalResult)
- Optional wordLimit

Constraints:

- Retrieved context must not exceed configured maximum.
- Word limit must be enforced strictly if present.

---

## 4.2 GenerationResponse

Represents validated output from AI layer.

Includes:

- text
- confidenceScore

Constraints:

- text must not exceed wordLimit.
- confidenceScore must be computed post-generation.
- Raw LLM output must never bypass validation.
- confidenceScore must be computed deterministically using cosine similarity between generated text embedding and top retrieved MemoryChunk embeddings.
- Computation method must remain consistent across sessions.
---

# 5. Agent Execution Models

## 5.1 AgentState

Allowed states:

- IDLE
- OBSERVE
- EXTRACT_FIELDS
- PLAN
- FILL
- VERIFY
- NEXT_PAGE
- COMPLETE
- ERROR

No dynamic state addition allowed.

---

## 5.2 AgentContext

Represents runtime state during agent execution.

Properties:

- currentState
- fields (FormField[])
- currentFieldIndex
- errors (string[])
- plannedFieldOrder (string[])

Constraints:

- currentState must always reflect actual execution state.
- currentFieldIndex must remain within bounds.
- errors must not contain user-sensitive data.
- plannedFieldOrder must remain stable during execution.
- FILL state must follow this order strictly.

---

# Boundary Rules

1. Configuration values are not part of data model.
2. UI state is not part of data model.
3. LLM raw responses are not part of data model.
4. DOM nodes are not part of data model.

Only structured, validated data enters these models.

---

Any structural modification requires:
- Updating this document
- Logging change in decision-log.md
- Updating associated TypeScript types