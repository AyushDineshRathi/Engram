import { z } from "zod";
import { FormFieldSchema } from "./form.schema";
import { FieldIntentSchema } from "./intent.schema";
import { RetrievalResultSchema } from "./memory.schema";

export const GenerationRequestSchema = z.object({
  field: FormFieldSchema,
  intent: FieldIntentSchema,
  retrievedContext: z.array(RetrievalResultSchema),
  wordLimit: z.number().int().positive().optional(),
});

export const GenerationResponseSchema = z.object({
  text: z.string().min(1),
  confidenceScore: z.number().min(0).max(1),
});