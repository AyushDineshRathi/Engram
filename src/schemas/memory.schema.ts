import { z } from "zod";

export const MemoryDocumentSchema = z.object({
  id: z.string().min(1),
  source: z.enum(["resume", "sop", "portfolio", "github"]),
  createdAt: z.number(),
});

export const MemoryChunkSchema = z.object({
  id: z.string().min(1),
  documentId: z.string().min(1),
  text: z.string().min(1),
  embedding: z.array(z.number()),
  tags: z.array(z.string()),
  createdAt: z.number(),
});

export const RetrievalResultSchema = z.object({
  chunkId: z.string().min(1),
  score: z.number().min(0).max(1),
  text: z.string().min(1),
});

export const EmbeddingConfigSchema = z.object({
  modelName: z.string().min(1),
  version: z.string().min(1),
  dimension: z.number().int().positive(),
});