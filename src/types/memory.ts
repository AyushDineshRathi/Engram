export interface MemoryDocument {
  id: string;
  source: "resume" | "sop" | "portfolio" | "github";
  createdAt: number;
}

export interface MemoryChunk {
  id: string;
  documentId: string;
  text: string;
  
  // Must match EmbeddingConfig.dimension exactly
  embedding: number[];
  tags: string[];
  createdAt: number;
}

export interface RetrievalResult {
  chunkId: string;
  score: number;
  text: string;
}

export interface EmbeddingConfig {
  modelName: string;
  version: string;
  dimension: number;
}