export interface EmbeddingSystemConfig {
  modelName: string;
  version: string;
  dimension: number;
}

export interface AgentConfig {
  maxRetriesPerField: number;
}

export interface GenerationConfig {
  maxRetrievedChunks: number;
  maxWordLimit: number;
}