import { describe, expect, it } from "vitest";
import { handleChat } from "../src/app/api/chat/route";
import { ScriptedModelClient } from "../src/lib/fakeModel";
import type { ToolClient, ToolName } from "../src/lib/types";

class FixtureTool implements ToolClient {
  async callTool(toolName: ToolName): Promise<unknown> {
    return { summary: `${toolName} reference result`, evidence: "reference-fixture" };
  }
}

describe("reference solution smoke test", () => {
  it("streams through the reference path", async () => {
    const model = new ScriptedModelClient();
    const events = await handleChat(
      {
        sessionId: "reference",
        userId: "reference-user",
        message: "Check customer context.",
        toolName: "weather"
      },
      { modelClient: model, toolClient: new FixtureTool() }
    );
    expect(model.streamCalls).toBe(1);
    expect(events.filter((event) => event.type === "token").length).toBeGreaterThanOrEqual(3);
  });
});
