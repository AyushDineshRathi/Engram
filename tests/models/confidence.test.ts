import { describe, it, expect } from "vitest";
import {
  cosineSimilarity,
  computeConfidenceScore,
} from "../../src/models/confidence";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const v = [1, 2, 3];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    const a = [1, 0];
    const b = [0, 1];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0);
  });
});

describe("computeConfidenceScore", () => {
  it("returns normalized score between 0 and 1", () => {
    const generated = [1, 0];
    const retrieved = [[1, 0]];

    const score = computeConfidenceScore(generated, retrieved);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("returns 0 when no retrieved embeddings", () => {
    const score = computeConfidenceScore([1, 2], []);
    expect(score).toBe(0);
  });
});