import { AgentState, type AgentContext } from "../types/agent";
import { agentConfig } from "../config/agent.config";

export function handleVerificationFailure(
  context: AgentContext
): AgentContext {
  if (context.retryCount < agentConfig.maxRetriesPerField) {
    return {
      ...context,
      retryCount: context.retryCount + 1,
      currentState: AgentState.FILL,
    };
  }

  return {
    ...context,
    currentState: AgentState.ERROR,
    errors: [...context.errors, "Verification failed after max retries"],
  };
}

export function handleVerificationSuccess(
  context: AgentContext,
  isLastField: boolean
): AgentContext {
  if (isLastField) {
    return {
      ...context,
      retryCount: 0,
      currentState: AgentState.NEXT_PAGE,
    };
  }

  return {
    ...context,
    retryCount: 0,
    currentFieldIndex: context.currentFieldIndex + 1,
    currentState: AgentState.FILL,
  };
}

export function resolveVerificationTransition(
  context: AgentContext,
  isValid: boolean,
  isLastField: boolean
): AgentContext {
  if (!isValid) {
    return handleVerificationFailure(context);
  }

  return handleVerificationSuccess(context, isLastField);
}
