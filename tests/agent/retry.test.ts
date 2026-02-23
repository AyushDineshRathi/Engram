import { describe, it, expect } from "vitest";
import {
  handleVerificationFailure,
  handleVerificationSuccess,
  resolveVerificationTransition,
} from "../../src/agent/transition";
import { AgentState } from "../../src/types/agent";

describe("Retry logic", () => {
  it("retries once before error", () => {
    const context = {
      currentState: AgentState.VERIFY,
      fields: [],
      currentFieldIndex: 0,
      plannedFieldOrder: [],
      retryCount: 0,
      errors: [],
    };

    const firstAttempt = handleVerificationFailure(context);
    expect(firstAttempt.currentState).toBe(AgentState.FILL);
    expect(firstAttempt.retryCount).toBe(1);

    const secondAttempt = handleVerificationFailure(firstAttempt);
    expect(secondAttempt.currentState).toBe(AgentState.ERROR);
  });

  it("resets retryCount after verification success and advances field", () => {
    const context = {
      currentState: AgentState.VERIFY,
      fields: [],
      currentFieldIndex: 0,
      plannedFieldOrder: [],
      retryCount: 1,
      errors: [],
    };

    const success = handleVerificationSuccess(context, false);
    expect(success.currentState).toBe(AgentState.FILL);
    expect(success.currentFieldIndex).toBe(1);
    expect(success.retryCount).toBe(0);
  });

  it("routes VERIFY deterministically by validity", () => {
    const context = {
      currentState: AgentState.VERIFY,
      fields: [],
      currentFieldIndex: 0,
      plannedFieldOrder: [],
      retryCount: 0,
      errors: [],
    };

    const failed = resolveVerificationTransition(context, false, false);
    expect(failed.currentState).toBe(AgentState.FILL);
    expect(failed.retryCount).toBe(1);

    const passed = resolveVerificationTransition(failed, true, true);
    expect(passed.currentState).toBe(AgentState.NEXT_PAGE);
    expect(passed.retryCount).toBe(0);
  });
});
