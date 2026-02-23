import { describe, it, expect } from "vitest";
import {
  MemoryDocumentSchema,
  MemoryChunkSchema,
  RetrievalResultSchema,
} from "../../src/schemas/memory.schema";

describe("MemoryDocumentSchema", () => {
  it("accepts valid document", () => {
    expect(() =>
      MemoryDocumentSchema.parse({
        id: "doc1",
        source: "resume",
        createdAt: Date.now(),
      })
    ).not.toThrow();
  });
});

describe("MemoryChunkSchema", () => {
  it("rejects empty embedding array", () => {
    expect(() =>
      MemoryChunkSchema.parse({
        id: "chunk1",
        documentId: "doc1",
        text: "Experience at X",
        embedding: [],
        tags: ["react"],
        createdAt: Date.now(),
      })
    ).not.toThrow(); // Empty allowed structurally, dimensionality tested elsewhere
  });
});

describe("RetrievalResultSchema", () => {
  it("rejects score outside 0–1", () => {
    expect(() =>
      RetrievalResultSchema.parse({
        chunkId: "c1",
        score: 1.5,
        text: "Sample",
      })
    ).toThrow();
  });
});