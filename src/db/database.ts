import Dexie, { type Table } from "dexie";

export interface MemoryDocument {
  id: string;
  type: string;
  fileName: string;
  createdAt: number;
}

export interface MemoryChunk {
  id: string;
  documentId: string;
  text: string;
  embedding: number[];
  tokenCount: number;
  createdAt: number;
}

export interface EmbeddingConfig {
  id: string;
  provider: string;
  model: string;
  dimension: number;
  createdAt: number;
}

class SmartAutoFillDatabase extends Dexie {
  memory_documents!: Table<MemoryDocument, string>;
  memory_chunks!: Table<MemoryChunk, string>;
  embedding_config!: Table<EmbeddingConfig, string>;

  constructor() {
    super("SmartAutoFillDB");

    this.version(1).stores({
      memory_documents: "id, type, fileName, createdAt",
      memory_chunks: "id, documentId, tokenCount, createdAt",
      embedding_config: "id, provider, model, dimension, createdAt",
    });
  }
}

export const db = new SmartAutoFillDatabase();

export async function addDocument(doc: MemoryDocument): Promise<string> {
  return db.memory_documents.put(doc);
}

export async function addChunks(chunks: MemoryChunk[]): Promise<string> {
  return db.memory_chunks.bulkPut(chunks);
}

export async function getDocumentById(id: string): Promise<MemoryDocument | undefined> {
  return db.memory_documents.get(id);
}
