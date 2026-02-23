import { AgentConfig } from "../types/config";
import { GenerationConfig } from "../types/config";

export interface SystemConfig extends AgentConfig, GenerationConfig {
  maxTokensPerChunk: 500;
  similarityThreshold: 0.8;
  maxGenerationRetries: 1;
}