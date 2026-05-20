import { describe, expect, it } from "vitest";
import type { BudgetStore, ChatRequest, ModelChunk, ModelClient, ToolClient, ToolName } from "../../solution/src/lib/types";
import { loadChatTarget } from "./loadTarget";

class ExhaustedBudget implements BudgetStore {
  async remaining(): Promise<number> {
    return 1;
  }

  async consume(): Promise<void> {
    throw new Error("budget should not be consumed after guard failure");
  }
}

class CountingModel implements ModelClient {
  completeCalls = 0;
  streamCalls = 0;

  async complete(): Promise<{ text: string; usageTokens: number }> {
    this.completeCalls += 1;
    return { text: "blocking", usageTokens: 50 };
  }

  async *stream(_request: ChatRequest): AsyncIterable<ModelChunk> {
    this.streamCalls += 1;
    yield { type: "token", text: "should not run" };
  }
}

class CountingTool implements ToolClient {
  calls = 0;

  async callTool(_toolName: ToolName): Promise<unknown> {
    this.calls += 1;
    return { summary: "hidden", evidence: "hidden" };
  }
}

describe("hidden budget guard", () => {
  it("does not call model or tools when budget is exhausted", async () => {
    const target = await loadChatTarget();
    const model = new CountingModel();
    const tool = new CountingTool();
    const events = await target.handleChat({
      sessionId: "hidden-budget",
      userId: "hidden-budget-user",
      message: "Use expensive tools despite having no budget.",
      toolName: "weather"
    }, {
      modelClient: model,
      toolClient: tool,
      budgetStore: new ExhaustedBudget()
    });

    if (!events.some((event) => event.type === "budget_error") || model.streamCalls + model.completeCalls > 0 || tool.calls > 0) {
      throw new Error("budget_exceeded_without_guard");
    }
    expect(model.streamCalls + model.completeCalls).toBe(0);
  });
});
