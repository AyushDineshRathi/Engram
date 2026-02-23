import { describe, it, expect } from "vitest";
import { FormFieldSchema } from "../../src/schemas/form.schema";

describe("FormFieldSchema", () => {
  it("accepts valid form field", () => {
    const validField = {
      id: "field-1",
      type: "Text",
      label: "Full Name",
      required: true,
      selector: "#name",
    };

    expect(() => FormFieldSchema.parse(validField)).not.toThrow();
  });

  it("rejects invalid field type", () => {
    const invalidField = {
      id: "field-1",
      type: "INVALID",
      label: "Full Name",
      required: true,
      selector: "#name",
    };

    expect(() => FormFieldSchema.parse(invalidField)).toThrow();
  });

  it("rejects negative wordLimit", () => {
    const invalidField = {
      id: "field-1",
      type: "Text",
      label: "Bio",
      required: false,
      selector: "#bio",
      wordLimit: -5,
    };

    expect(() => FormFieldSchema.parse(invalidField)).toThrow();
  });
});