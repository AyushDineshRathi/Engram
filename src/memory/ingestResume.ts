import { chunkText } from "./chunker";
import { EmbeddingService } from "./embeddingService";
import {
  addChunks,
  addDocument,
  db,
  type EmbeddingConfig,
  type MemoryChunk,
  type MemoryDocument,
} from "../db/database";

interface IngestResumeParams {
  fileName: string;
  rawText: string;
}

const MIN_RESUME_TEXT_LENGTH = 50;

function hashString(input: string): string {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function createDocumentId(fileName: string, rawText: string): string {
  return `doc_${hashString(`${fileName}\n${rawText}`)}`;
}

function getEmbeddingModelName(embeddingService: EmbeddingService): string {
  const model = (embeddingService as { model?: unknown }).model;
  return typeof model === "string" && model.length > 0 ? model : "unknown";
}

export async function ingestResume(params: IngestResumeParams): Promise<void> {
  const normalizedText = params.rawText.trim();

  if (normalizedText.length < MIN_RESUME_TEXT_LENGTH) {
    throw new Error(
      `Resume text is too short for ingestion. Expected at least ${MIN_RESUME_TEXT_LENGTH} characters.`
    );
  }

  const documentId = createDocumentId(params.fileName, normalizedText);
  const createdAt = Date.now();

  const document: MemoryDocument = {
    id: documentId,
    type: "resume",
    fileName: params.fileName,
    createdAt,
  };

  try {
    await addDocument(document);
  } catch (error) {
    throw new Error("Failed to store resume document.", { cause: error });
  }

  let chunkInputs;
  try {
    chunkInputs = chunkText(normalizedText);
  } catch (error) {
    throw new Error("Failed to chunk resume text.", { cause: error });
  }

  if (chunkInputs.length === 0) {
    throw new Error("Resume text could not be chunked into memory chunks.");
  }

  const chunkTexts = chunkInputs.map((chunk) => chunk.text);

  const embeddingService = new EmbeddingService();
  let embeddingResults;
  try {
    embeddingResults = await embeddingService.generateEmbeddings(chunkTexts);
  } catch (error) {
    throw new Error("Failed to generate embeddings for resume chunks.", { cause: error });
  }

  if (embeddingResults.length !== chunkInputs.length) {
    throw new Error(
      `Embedding/chunk mismatch: expected ${chunkInputs.length} embeddings, received ${embeddingResults.length}.`
    );
  }

  const firstEmbedding = embeddingResults[0]?.embedding;
  if (!firstEmbedding || firstEmbedding.length === 0) {
    throw new Error("Missing or invalid embedding vector dimension.");
  }

  const embeddingConfig: EmbeddingConfig = {
    id: "default",
    provider: "gemini",
    model: getEmbeddingModelName(embeddingService),
    dimension: firstEmbedding.length,
    createdAt: Date.now(),
  };

  let existingConfig: EmbeddingConfig | undefined;
  try {
    existingConfig = await db.embedding_config.get("default");
  } catch (error) {
    throw new Error("Failed to read embedding configuration.", { cause: error });
  }

  if (!existingConfig) {
    try {
      await db.embedding_config.put(embeddingConfig);
    } catch (error) {
      throw new Error("Failed to store embedding configuration.", { cause: error });
    }
  } else if (
    existingConfig.provider !== embeddingConfig.provider ||
    existingConfig.model !== embeddingConfig.model
  ) {
    throw new Error(
      `Embedding configuration mismatch: expected ${existingConfig.provider}/${existingConfig.model}, received ${embeddingConfig.provider}/${embeddingConfig.model}.`
    );
  }

  const memoryChunks: MemoryChunk[] = chunkInputs.map((chunkInput, index) => {
    const embeddingResult = embeddingResults[index];

    if (!embeddingResult || !Array.isArray(embeddingResult.embedding)) {
      throw new Error(`Missing or invalid embedding at chunk index ${index}.`);
    }

    return {
      id: `${documentId}_${chunkInput.id}`,
      documentId,
      text: chunkInput.text,
      embedding: embeddingResult.embedding,
      tokenCount: chunkInput.tokenCount,
      createdAt: chunkInput.createdAt,
    };
  });

  try {
    await addChunks(memoryChunks);
  } catch (error) {
    throw new Error("Failed to store resume chunks.", { cause: error });
  }
}
