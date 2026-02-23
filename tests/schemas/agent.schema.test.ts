import { describe, it, expect } from "vitest";
import { AgentContextSchema } from "../../src/schemas/agent.schema";

describe("AgentContextSchema", () => {
  it("accepts valid agent context", () => {
    expect(() =>
      AgentContextSchema.parse({
        currentState: "IDLE",
        fields: [],
        currentFieldIndex: 0,
        plannedFieldOrder: [],
        retryCount: 0,
        errors: [],
      })
    ).not.toThrow();
  });

  it("rejects negative retryCount", () => {
    expect(() =>
      AgentContextSchema.parse({
        currentState: "IDLE",
        fields: [],
        currentFieldIndex: 0,
        plannedFieldOrder: [],
        retryCount: -1,
        errors: [],
      })
    ).toThrow();
  });
});