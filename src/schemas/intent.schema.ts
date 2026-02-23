import { z } from "zod";

export const FieldIntentSchema = z.enum([
  "BASIC_INFO",
  "TECHNICAL_EXPERIENCE",
  "BEHAVIORAL_STORY",
  "MOTIVATION",
  "DOMAIN_MATCH",
  "LEADERSHIP",
  "SHORT_ANSWER",
  "UNKNOWN",
]);