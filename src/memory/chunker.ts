export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

export interface MemoryChunkInput {
  id: string;
  text: string;
  tokenCount: number;
  createdAt: number;
}

const DEFAULT_CHUNK_SIZE = 300;
const DEFAULT_OVERLAP = 50;
const MIN_CHUNK_TOKENS = 20;

export function chunkText(text: string, options?: ChunkOptions): MemoryChunkInput[] {
  const normalized = text.trim();
  if (normalized.length === 0) return [];

  const tokens = normalized.split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length < MIN_CHUNK_TOKENS) return [];

  const chunkSize = Math.max(1, Math.floor(options?.chunkSize ?? DEFAULT_CHUNK_SIZE));
  const overlap = Math.max(0, Math.floor(options?.overlap ?? DEFAULT_OVERLAP));
  const step = Math.max(1, chunkSize - overlap);
  const baseTimestamp = deterministicNumber(normalized);

  const chunks: MemoryChunkInput[] = [];

  for (let start = 0, index = 0; start < tokens.length; start += step, index++) {
    const slice = tokens.slice(start, start + chunkSize);
    if (slice.length < MIN_CHUNK_TOKENS) continue;

    const chunkTextValue = slice.join(" ").trim();
    if (chunkTextValue.length === 0) continue;

    chunks.push({
      id: `chunk_${index}_${baseTimestamp}`,
      text: chunkTextValue,
      tokenCount: slice.length,
      createdAt: baseTimestamp + index,
    });
  }

  return chunks;
}

function deterministicNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
