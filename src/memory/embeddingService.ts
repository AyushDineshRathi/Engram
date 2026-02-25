export interface EmbeddingResult {
  text: string;
  embedding: number[];
}

interface GeminiEmbeddingItem {
  values?: number[];
  embedding?: number[];
}

interface GeminiEmbedContentResponse {
  embedding?: GeminiEmbeddingItem;
}

const DEFAULT_MODEL = "gemini-embedding-001";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getGeminiApiKey(): string {
  const apiKey =
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      ?.GEMINI_API_KEY ?? "";

  if (apiKey.trim().length === 0) {
    throw new Error("Missing Gemini API key: process.env.GEMINI_API_KEY is not set.");
  }

  return apiKey;
}

export class EmbeddingService {
  private readonly model: string;

  constructor(model: string = DEFAULT_MODEL) {
    this.model = model;
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) {
      return [];
    }

    const apiKey = getGeminiApiKey();
    const modelPath = this.model.startsWith("models/") ? this.model : `models/${this.model}`;
    const endpoint = `${GEMINI_API_BASE}/${modelPath}:embedContent`;

    const embeddingVectors = await Promise.all(
      texts.map(async (text, index) => {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
          },
          body: JSON.stringify({
            content: {
              parts: [{ text }],
            },
          }),
        }).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "Unknown fetch error";
          throw new Error(
            `Gemini embedding request failed at index ${index}: ${message}. ` +
              "Check internet access, firewall/proxy settings, and API host reachability."
          );
        });

        if (!response.ok) {
          const details = await response.text().catch(() => "");
          throw new Error(
            `Gemini embedding request returned ${response.status} ${response.statusText} at index ${index}${
              details ? `: ${details}` : ""
            }`
          );
        }

        const data = (await response.json()) as GeminiEmbedContentResponse;
        const vector = data.embedding?.values ?? data.embedding?.embedding;

        if (!Array.isArray(vector) || vector.some((value) => typeof value !== "number")) {
          throw new Error(`Invalid embedding vector at index ${index}.`);
        }

        return vector;
      })
    );

    return texts.map((text, index) => {
      const vector = embeddingVectors[index];
      if (!vector) {
        throw new Error(`Missing embedding vector at index ${index}.`);
      }

      return {
        text,
        embedding: vector,
      };
    });
  }
}
