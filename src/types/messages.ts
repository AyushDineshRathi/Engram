import { FormField } from "./form";
import { GenerationRequest } from "./generation";

export type ContentToBackgroundMessage =
  | { type: "EXTRACT_FIELDS"; payload: FormField[] }
  | { type: "REQUEST_GENERATION"; payload: GenerationRequest };
  
export type BackgroundToContentMessage =
  | { type: "FILL_FIELD"; payload: { selector: string; value: string } }
  | { type: "ERROR"; payload: string };