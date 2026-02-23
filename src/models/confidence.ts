export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embedding dimension mismatch");
  }

  return a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
}

export function magnitude(vector: number[]): number {
  return Math.sqrt(dotProduct(vector, vector));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);

  if (magA === 0 || magB === 0) {
    throw new Error("Zero vector encountered in cosine similarity");
  }

  return dotProduct(a, b) / (magA * magB);
}

export function normalizeCosine(value: number): number {
  return (value + 1) / 2;
}

export function computeConfidenceScore(
  generatedEmbedding: number[],
  retrievedEmbeddings: number[][]
): number {
  if (retrievedEmbeddings.length === 0) {
    return 0;
  }

  const similarities = retrievedEmbeddings.map((chunk) =>
    cosineSimilarity(generatedEmbedding, chunk)
  );

  const maxSimilarity = Math.max(...similarities);

  return normalizeCosine(maxSimilarity);
}