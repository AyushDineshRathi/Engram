import { z } from "zod";

export const FieldTypeSchema = z.enum([
  "Text",
  "Textarea",
  "Select",
  "Radio",
  "Checkbox",
  "Richtext",
]);

export const FormFieldSchema = z.object({
  id: z.string().min(1),
  type: FieldTypeSchema,
  label: z.string().min(1),
  contextText: z.string().optional(),
  required: z.boolean(),
  selector: z.string().min(1),
  placeholder: z.string().optional(),
  wordLimit: z.number().int().positive().optional(),
});