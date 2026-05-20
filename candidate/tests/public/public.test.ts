import { describe, expect, it } from "vitest";
import { InMemoryBudgetStore } from "../../src/lib/budget";
import { ScriptedModelClient } from "../../src/lib/fakeModel";
import { MemoryToolCache } from "../../src/lib/toolCache";
import type { ChatRequest, ToolClient, ToolName } from "../../src/lib/types";
import { loadChatTarget } from "./loadTarget";

const request: ChatRequest = {
  sessionId: "sess_public_unit",
  userId: "user_public",
  message: "Can you check weather before the customer visit?",
  toolName: "weather"
};

class CountingToolClient implements ToolClient {
  calls = 0;

  async callTool(toolName: ToolName): Promise<unknown> {
    this.calls += 1;
    return { summary: `${toolName} clear`, evidence: "fixture:weather" };
  }
}

describe("public streaming chat contract", () => {
  it("returns schema-valid chat events", async () => {
    const target = await loadChatTarget();
    const events = await target.handleChat(request, {
      modelClient: new ScriptedModelClient(),
      toolClient: new CountingToolClient()
    });
    expect(Array.isArray(events)).toBe(true);
    expect(events[0]?.type).toBe("message_start");
    expect(events.at(-1)?.type).toBe("done");
    for (const [index, event] of events.entries()) {
      expect(event.sequence).toBe(index);
      expect(typeof event.type).toBe("string");
    }
  });

  it("streams multiple token chunks instead of one blocking response", async () => {
    const target = await loadChatTarget();
    const model = new ScriptedModelClient();
    const events = await target.handleChat(request, {
      modelClient: model,
      toolClient: new CountingToolClient()
    });
    const tokens = events.filter((event) => event.type === "token");
    if (tokens.length < 3 || model.streamCalls === 0) {
      throw new Error("streaming_not_implemented");
    }
    expect(tokens.map((event) => event.text).join("")).toContain("Checking the account");
  });

  it("rejects exhausted budgets before model or tool work starts", async () => {
    const target = await loadChatTarget();
    const model = new ScriptedModelClient();
    const tool = new CountingToolClient();
    const events = await target.handleChat(request, {
      modelClient: model,
      toolClient: tool,
      budgetStore: new InMemoryBudgetStore({ user_public: 0 })
    });
    const budgetEvent = events.find((event) => event.type === "budget_error");
    if (!budgetEvent || model.completeCalls + model.streamCalls > 0 || tool.calls > 0) {
      throw new Error("budget_exceeded_without_guard");
    }
    expect(budgetEvent.type).toBe("budget_error");
  });

  it("uses cache for repeated tool calls with the same arguments", async () => {
    const target = await loadChatTarget();
    const tool = new CountingToolClient();
    const cache = new MemoryToolCache();
    await target.handleChat(request, {
      modelClient: new ScriptedModelClient(),
      toolClient: tool,
      toolCache: cache
    });
    await target.handleChat(request, {
      modelClient: new ScriptedModelClient(),
      toolClient: tool,
      toolCache: cache
    });
    if (tool.calls !== 1) {
      throw new Error("tool_cache_miss");
    }
    expect(tool.calls).toBe(1);
  });
});
