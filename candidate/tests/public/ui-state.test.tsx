import { describe, expect, it } from "vitest";
import { loadPanelTarget } from "./loadPanelTarget";

describe("public ChatPanel state contract", () => {
  it("renders partial stream tokens in order", async () => {
    const panel = await loadPanelTarget();
    const state = panel.applyChatEvents([
      { type: "message_start", sequence: 0, text: "Check account status." },
      { type: "token", sequence: 1, text: "Checking " },
      { type: "token", sequence: 2, text: "the " },
      { type: "token", sequence: 3, text: "account." },
      { type: "done", sequence: 4 }
    ]);

    if (state.transcript !== "Checking the account." || !state.done) {
      throw new Error("ui_stream_state_missing");
    }
    expect(state.transcript).toBe("Checking the account.");
  });

  it("shows tool lifecycle, cached results, abort state, and controlled tool errors", async () => {
    const panel = await loadPanelTarget();
    const state = panel.applyChatEvents([
      { type: "message_start", sequence: 0, text: "Check weather." },
      { type: "token", sequence: 1, text: "Looking " },
      { type: "tool_call", sequence: 2, toolName: "weather", toolCallId: "tool-1" },
      {
        type: "tool_result",
        sequence: 3,
        toolName: "weather",
        toolCallId: "tool-1",
        result: { summary: "clear skies", evidence: "simulator:weather" },
        cached: false
      },
      { type: "token", sequence: 4, text: "complete." },
      { type: "tool_call", sequence: 5, toolName: "weather", toolCallId: "tool-2" },
      {
        type: "tool_result",
        sequence: 6,
        toolName: "weather",
        toolCallId: "tool-2",
        result: { summary: "cached clear skies", evidence: "simulator:weather" },
        cached: true
      },
      {
        type: "tool_error",
        sequence: 7,
        toolName: "weather",
        toolCallId: "tool-3",
        error: "tool returned malformed output",
        marker: "malformed_tool_output_handled"
      },
      { type: "aborted", sequence: 8, error: "chat stream aborted", marker: "stream_abort_propagated" },
      { type: "done", sequence: 9 }
    ]);

    if (state.transcript !== "Looking complete.") {
      throw new Error("ui_stream_state_missing");
    }
    if (state.toolStatus !== "error" || state.toolName !== "weather" || state.cachedToolResult !== true) {
      throw new Error("tool_ui_state_missing");
    }
    if (!state.aborted || !state.error?.includes("chat stream aborted")) {
      throw new Error("abort_ui_state_missing");
    }
    expect(state.cachedToolResult).toBe(true);
  });
});
