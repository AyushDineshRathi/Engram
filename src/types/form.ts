export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "richtext";

export interface FormField {
  // Must be deterministic hash of DOM path.
  // Must remain stable across multiple scans.
  
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  contextText: string;
  wordLimit?: string;
  required: boolean;
  selector: string;
}