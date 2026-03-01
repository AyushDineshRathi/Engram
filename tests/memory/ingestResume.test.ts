import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../src/db/database";
import { EmbeddingService } from "../../src/memory/embeddingService";
import { ingestResume } from "../../src/memory/ingestResume";

function makeResumeText(wordCount: number): string {
  return Array.from({ length: wordCount }, (_, i) => `token${i + 1}`).join(" ");
}

describe("ingestResume integration", () => {
  beforeEach(async () => {
    await db.embedding_config.clear();
    await db.memory_chunks.clear();
    await db.memory_documents.clear();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.embedding_config.clear();
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

  it("throws on duplicate resume ingestion", async () => {
    const rawText = makeResumeText(120);
    vi.spyOn(EmbeddingService.prototype, "generateEmbeddings").mockImplementation(
      async (texts: string[]) => texts.map((text, index) => ({ text, embedding: [index + 0.1, index + 0.2] }))
    );

    await ingestResume({ fileName: "resume.pdf", rawText });

    await expect(ingestResume({ fileName: "resume-copy.pdf", rawText })).rejects.toThrow(
      "Resume already ingested."
    );
  });

  it("stores exactly one embedding_config row after ingestion", async () => {
    const rawText = makeResumeText(120);
    vi.spyOn(EmbeddingService.prototype, "generateEmbeddings").mockImplementation(
      async (texts: string[]) => texts.map((text, index) => ({ text, embedding: [index + 0.1, index + 0.2] }))
    );

    await ingestResume({ fileName: "resume.pdf", rawText });

    const configs = await db.embedding_config.toArray();
    expect(configs).toHaveLength(1);
  });

  it("does not create new rows when re-ingesting the same resume", async () => {
    const rawText = makeResumeText(120);
    vi.spyOn(EmbeddingService.prototype, "generateEmbeddings").mockImplementation(
      async (texts: string[]) => texts.map((text, index) => ({ text, embedding: [index + 0.1, index + 0.2] }))
    );

    await ingestResume({ fileName: "resume.pdf", rawText });

    const initialDocumentCount = await db.memory_documents.count();
    const initialChunkCount = await db.memory_chunks.count();
    const initialConfigCount = await db.embedding_config.count();

    await expect(ingestResume({ fileName: "resume.pdf", rawText })).rejects.toThrow(
      "Resume already ingested."
    );

    expect(await db.memory_documents.count()).toBe(initialDocumentCount);
    expect(await db.memory_chunks.count()).toBe(initialChunkCount);
    expect(await db.embedding_config.count()).toBe(initialConfigCount);
  });
});
