import { describe, expect, it } from "vitest";
import { MemoryToolCache } from "../../src/lib/toolCache";
import { loadChatTarget } from "./loadTarget";

const baseUrl = process.env.CHAT_SIMULATOR_URL ?? "http://localhost:8095";

async function waitForSimulator() {
  const deadline = Date.now() + 30_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`simulator_not_ready:${String(lastError)}`);
}

async function resetSimulator() {
  await waitForSimulator();
  await fetch(`${baseUrl}/reset`, { method: "POST" });
}

async function metrics() {
  const response = await fetch(`${baseUrl}/metrics`);
  return response.json() as Promise<{ completeCalls: number; streamCalls: number; toolCalls: { weather: number } }>;
}

describe("Docker-backed chat simulator path", () => {
  it("uses the streaming model endpoint and caches repeated tool results", async () => {
    await resetSimulator();
    const target = await loadChatTarget();
    const cache = new MemoryToolCache();
    const request = {
      sessionId: "sess_public_integration",
      userId: "user_public_integration",
      message: "Check weather before the customer meeting.",
      toolName: "weather" as const
    };

    const first = await target.handleChat(request, { simulatorBaseUrl: baseUrl, toolCache: cache });
    const second = await target.handleChat(request, { simulatorBaseUrl: baseUrl, toolCache: cache });
    const observed = await metrics();

    if (observed.streamCalls < 2 || first.filter((event) => event.type === "token").length < 3) {
      throw new Error("streaming_not_implemented");
    }
    if (observed.toolCalls.weather !== 1 || !second.some((event) => event.type === "tool_result" && event.cached === true)) {
      throw new Error("tool_cache_miss");
    }
    expect(observed.completeCalls).toBe(0);
    expect(observed.toolCalls.weather).toBe(1);
  });
});
