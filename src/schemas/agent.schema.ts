import { z } from "zod";
import { FormFieldSchema } from "./form.schema";

export const AgentStateSchema = z.enum([
  "IDLE",
  "OBSERVE",
  "EXTRACT_FIELDS",
  "PLAN",
  "FILL",
  "VERIFY",
  "NEXT_PAGE",
  "COMPLETE",
  "ERROR",
]);

export const AgentContextSchema = z.object({
  currentState: AgentStateSchema,
  fields: z.array(FormFieldSchema),
  currentFieldIndex: z.number().int().nonnegative(),
  plannedFieldOrder: z.array(z.string()),
  retryCount: z.number().int().nonnegative(),
  errors: z.array(z.string()),
});