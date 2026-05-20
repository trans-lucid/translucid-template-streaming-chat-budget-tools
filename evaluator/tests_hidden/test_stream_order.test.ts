import { describe, expect, it } from "vitest";
import type { ModelChunk, ModelClient } from "../../solution/src/lib/types";
import { loadChatTarget } from "./loadTarget";

class OrderedModel implements ModelClient {
  completeCalls = 0;
  streamCalls = 0;

  async complete(): Promise<{ text: string; usageTokens: number }> {
    this.completeCalls += 1;
    return { text: "blocking", usageTokens: 10 };
  }

  async *stream(): AsyncIterable<ModelChunk> {
    this.streamCalls += 1;
    yield { type: "token", text: "A" };
    yield { type: "token", text: "B" };
    yield { type: "token", text: "C" };
    yield { type: "done", usageTokens: 12 };
  }
}

describe("hidden stream ordering", () => {
  it("preserves emitted token order and monotonic event sequence", async () => {
    const target = await loadChatTarget();
    const events = await target.handleChat({
      sessionId: "hidden-order",
      userId: "hidden-user",
      message: "Keep chunks in order."
    }, {
      modelClient: new OrderedModel()
    });

    const tokenText = events.filter((event) => event.type === "token").map((event) => event.text).join("");
    if (tokenText !== "ABC" || events.some((event, index) => event.sequence !== index)) {
      throw new Error("stream_chunks_out_of_order");
    }
    expect(tokenText).toBe("ABC");
  });
});

