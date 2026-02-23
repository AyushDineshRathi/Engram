import { describe, it, expect } from "vitest";
import { GenerationResponseSchema } from "../../src/schemas/generation.schema";

describe("GenerationResponseSchema", () => {
  it("accepts valid response", () => {
    expect(() =>
      GenerationResponseSchema.parse({
        text: "I am passionate about AI.",
        confidenceScore: 0.82,
      })
    ).not.toThrow();
  });

  it("rejects confidenceScore > 1", () => {
    expect(() =>
      GenerationResponseSchema.parse({
        text: "Invalid",
        confidenceScore: 1.2,
      })
    ).toThrow();
  });
});