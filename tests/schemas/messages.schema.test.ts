import { describe, it, expect } from "vitest";
import { ContentToBackgroundSchema } from "../../src/schemas/messages.schema";

describe("ContentToBackgroundSchema", () => {
  it("accepts EXTRACT_FIELDS message", () => {
    expect(() =>
      ContentToBackgroundSchema.parse({
        type: "EXTRACT_FIELDS",
        payload: [],
      })
    ).not.toThrow();
  });

  it("rejects invalid message type", () => {
    expect(() =>
      ContentToBackgroundSchema.parse({
        type: "UNKNOWN",
        payload: {},
      })
    ).toThrow();
  });
});