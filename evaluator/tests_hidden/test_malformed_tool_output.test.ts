import { describe, expect, it } from "vitest";
import type { ChatRequest, ModelChunk, ModelClient, ToolClient, ToolName } from "../../solution/src/lib/types";
import { loadChatTarget } from "./loadTarget";

class StreamingModel implements ModelClient {
  async complete(): Promise<{ text: string; usageTokens: number }> {
    return { text: "blocking", usageTokens: 50 };
  }

  async *stream(_request: ChatRequest): AsyncIterable<ModelChunk> {
    yield { type: "token", text: "checking " };
    yield { type: "tool_call", toolName: "weather", toolCallId: "hidden-malformed-tool" };
    yield { type: "done", usageTokens: 55 };
  }
}

class MalformedTool implements ToolClient {
  async callTool(_toolName: ToolName): Promise<unknown> {
    return { wrong: "shape" };
  }
}

describe("hidden malformed tool output", () => {
  it("returns a controlled tool error instead of crashing", async () => {
    const target = await loadChatTarget();
    const events = await target.handleChat({
      sessionId: "hidden-malformed",
      userId: "hidden-user",
      message: "Call a malformed tool.",
      toolName: "weather"
    }, {
      modelClient: new StreamingModel(),
      toolClient: new MalformedTool()
    });

    if (!events.some((event) => event.type === "tool_error" && event.marker === "malformed_tool_output_handled")) {
      throw new Error("malformed_tool_output_crash");
    }
    expect(events.at(-1)?.type).toBe("done");
  });
});
