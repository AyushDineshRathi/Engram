import { FormField } from "./form";
import { FieldIntent } from "./intent";
import { RetrievalResult } from "./memory";

export interface GenerationRequest {
  field: FormField;
  intent: FieldIntent;
  retrievedContext: RetrievalResult[];

  // Must not exceed GenerationRequest.wordLimit if provided
  wordLimit?: number;
}

export interface GenerationResponse {
  text: string;
  confidenceScore: number;
}