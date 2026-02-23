import { describe, it, expect } from "vitest";
import { FieldIntentSchema } from "../../src/schemas/intent.schema";

describe("FieldIntentSchema", () => {
  it("accepts valid intent", () => {
    expect(() => FieldIntentSchema.parse("MOTIVATION")).not.toThrow();
  });

  it("rejects unknown intent", () => {
    expect(() => FieldIntentSchema.parse("FREE_TEXT")).toThrow();
  });
});