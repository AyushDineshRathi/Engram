import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../src/db/database";
import { EmbeddingService } from "../../src/memory/embeddingService";
import { ingestResume } from "../../src/memory/ingestResume";

function makeResumeText(wordCount: number): string {
  return Array.from({ length: wordCount }, (_, i) => `token${i + 1}`).join(" ");
}

describe("ingestResume integration", () => {
  beforeEach(async () => {
    await db.memory_chunks.clear();
    await db.memory_documents.clear();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.memory_chunks.clear();
    await db.memory_documents.clear();
  });

  it("stores one document and chunk embeddings using real Dexie", async () => {
    const rawText = makeResumeText(120);

    vi.spyOn(EmbeddingService.prototype, "generateEmbeddings").mockImplementation(
      async (texts: string[]) => texts.map((text, index) => ({ text, embedding: [index + 0.1, index + 0.2] }))
    );

    await ingestResume({
      fileName: "resume.pdf",
      rawText,
    });

    const documents = await db.memory_documents.toArray();
    expect(documents).toHaveLength(1);

    const storedDocument = documents[0];
    if (!storedDocument) {
      throw new Error("Expected one stored document.");
    }

    const chunks = await db.memory_chunks.where("documentId").equals(storedDocument.id).toArray();
    expect(chunks.length).toBeGreaterThan(0);

    for (const chunk of chunks) {
      expect(Array.isArray(chunk.embedding)).toBe(true);
      expect(chunk.embedding.length).toBe(2);
      expect(chunk.embedding.every((value) => typeof value === "number")).toBe(true);
    }
  });
});
