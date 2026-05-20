import { describe, expect, it } from "vitest";
import type { ChatRequest, ModelChunk, ModelClient, ToolCache, ToolClient, ToolName } from "../../solution/src/lib/types";
import { loadChatTarget } from "./loadTarget";

class StreamingModel implements ModelClient {
  async complete(): Promise<{ text: string; usageTokens: number }> {
    return { text: "blocking", usageTokens: 50 };
  }

  async *stream(_request: ChatRequest): AsyncIterable<ModelChunk> {
    yield { type: "token", text: "checking " };
    yield { type: "tool_call", toolName: "weather", toolCallId: "hidden-cache-tool" };
    yield { type: "done", usageTokens: 55 };
  }
}

class SharedCache implements ToolCache {
  private readonly entries = new Map<string, unknown>();

  async get(key: string): Promise<unknown | undefined> {
    return this.entries.get(key);
  }

  async set(key: string, value: unknown): Promise<void> {
    this.entries.set(key, value);
  }
}

class CountingTool implements ToolClient {
  calls = 0;

  async callTool(toolName: ToolName): Promise<unknown> {
    this.calls += 1;
    return { summary: `${toolName} hidden`, evidence: "hidden-cache" };
  }
}

describe("hidden cache validity", () => {
  it("reuses valid tool results for identical repeated calls", async () => {
    const target = await loadChatTarget();
    const cache = new SharedCache();
    const tool = new CountingTool();
    const request = {
      sessionId: "hidden-cache",
      userId: "hidden-user",
      message: "Check the same weather twice.",
      toolName: "weather" as const
    };

    await target.handleChat(request, { modelClient: new StreamingModel(), toolClient: tool, toolCache: cache });
    const second = await target.handleChat(request, { modelClient: new StreamingModel(), toolClient: tool, toolCache: cache });

    if (tool.calls !== 1 || !second.some((event) => event.type === "tool_result" && event.cached === true)) {
      throw new Error("tool_cache_miss");
    }
    expect(tool.calls).toBe(1);
  });
});
