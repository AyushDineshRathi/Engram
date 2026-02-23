import { FormField } from "./form";

export enum AgentState {
  IDLE = "IDLE",
  OBSERVE = "OBSERVE",
  EXTRACT_FIELDS = "EXTRACT_FIELDS",
  PLAN = "PLAN",
  FILL = "FILL",
  VERIFY = "VERIFY",
  NEXT_PAGE = "NEXT_PAGE",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR"
}

export interface AgentContext {
  currentState: AgentState
  fields: FormField[]
  currentFieldIndex: number
  plannedFieldOrder: string[];
  retryCount: number;
  errors: string[]
}