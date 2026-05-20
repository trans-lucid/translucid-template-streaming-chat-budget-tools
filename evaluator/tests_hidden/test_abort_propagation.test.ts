import { describe, expect, it } from "vitest";
import type { ChatRequest, ModelChunk, ModelClient, ToolClient, ToolName } from "../../solution/src/lib/types";
import { loadChatTarget } from "./loadTarget";

class AbortingModel implements ModelClient {
  completeCalls = 0;
  streamCalls = 0;

  constructor(private readonly controller: AbortController) {}

  async complete(): Promise<{ text: string; usageTokens: number }> {
    this.completeCalls += 1;
    return { text: "blocking", usageTokens: 20 };
  }

  async *stream(): AsyncIterable<ModelChunk> {
    this.streamCalls += 1;
    yield { type: "token", text: "starting " };
    this.controller.abort();
    yield { type: "tool_call", toolName: "weather", toolCallId: "should-not-run" };
  }
}

class CountingTool implements ToolClient {
  calls = 0;

  async callTool(_toolName: ToolName): Promise<unknown> {
    this.calls += 1;
    return { summary: "should not happen", evidence: "hidden" };
  }
}

describe("hidden abort propagation", () => {
  it("stops model/tool work when abort fires mid-stream", async () => {
    const target = await loadChatTarget();
    const controller = new AbortController();
    const model = new AbortingModel(controller);
    const tool = new CountingTool();
    const request: ChatRequest = {
      sessionId: "hidden-abort",
      userId: "hidden-user",
      message: "Start then abort before tool execution.",
      toolName: "weather"
    };

    const events = await target.handleChat(request, {
      modelClient: model,
      toolClient: tool,
      signal: controller.signal
    });

    if (!events.some((event) => event.type === "aborted") || tool.calls !== 0) {
      throw new Error("stream_abort_not_propagated");
    }
    expect(tool.calls).toBe(0);
  });
});

