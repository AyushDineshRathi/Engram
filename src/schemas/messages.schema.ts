import { z } from "zod";
import { FormFieldSchema } from "./form.schema";
import { GenerationRequestSchema } from "./generation.schema";

export const ContentToBackgroundSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("EXTRACT_FIELDS"),
    payload: z.array(FormFieldSchema),
  }),
  z.object({
    type: z.literal("REQUEST_GENERATION"),
    payload: GenerationRequestSchema,
  }),
]);

export const BackgroundToContentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("FILL_FIELD"),
    payload: z.object({
      selector: z.string(),
      value: z.string(),
    }),
  }),
  z.object({
    type: z.literal("ERROR"),
    payload: z.string(),
  }),
]);