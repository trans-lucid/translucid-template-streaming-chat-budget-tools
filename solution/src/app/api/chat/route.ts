import { estimateTokens, InMemoryBudgetStore } from "../../../lib/budget";
import { HttpModelClient } from "../../../lib/fakeModel";
import { buildToolCacheKey, MemoryToolCache } from "../../../lib/toolCache";
import { HttpToolClient, validateToolResult } from "../../../lib/tools";
import type { ChatEvent, ChatRequest, ChatRuntimeOptions, ToolName } from "../../../lib/types";

const TOOL_CACHE_TTL_MS = 60_000;

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("aborted", "AbortError");
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function toolArgs(request: ChatRequest, toolName: ToolName): Record<string, unknown> {
  return {
    toolName,
    sessionId: request.sessionId,
    userId: request.userId,
    prompt: request.message
  };
}

export async function handleChat(request: ChatRequest, options: ChatRuntimeOptions = {}): Promise<ChatEvent[]> {
  const baseUrl = options.simulatorBaseUrl ?? "http://localhost:8095";
  const model = options.modelClient ?? new HttpModelClient(baseUrl);
  const tools = options.toolClient ?? new HttpToolClient(baseUrl);
  const budget = options.budgetStore ?? new InMemoryBudgetStore();
  const cache = options.toolCache ?? new MemoryToolCache();
  const signal = options.signal;

  const events: ChatEvent[] = [{ type: "message_start", sequence: 0, text: request.message }];
  const estimatedCost = estimateTokens(request.message) + 64;
  const remaining = await budget.remaining(request.userId);
  if (remaining < estimatedCost) {
    events.push({
      type: "budget_error",
      sequence: events.length,
      error: `remaining budget ${remaining} is below estimated cost ${estimatedCost}`,
      marker: "budget_guard_triggered"
    });
    events.push({ type: "done", sequence: events.length, usageTokens: 0 });
    return events;
  }

  let usageTokens = estimatedCost;

  try {
    for await (const chunk of model.stream(request, { signal })) {
      assertNotAborted(signal);

      if (chunk.type === "token") {
        events.push({ type: "token", sequence: events.length, text: chunk.text ?? "" });
        continue;
      }

      if (chunk.type === "tool_call" && chunk.toolName) {
        const toolName = chunk.toolName;
        const args = toolArgs(request, toolName);
        const key = buildToolCacheKey(toolName, args);
        events.push({
          type: "tool_call",
          sequence: events.length,
          toolName,
          toolCallId: chunk.toolCallId ?? key
        });

        assertNotAborted(signal);
        const cached = await cache.get(key);
        if (cached !== undefined) {
          events.push({
            type: "tool_result",
            sequence: events.length,
            toolName,
            toolCallId: chunk.toolCallId ?? key,
            result: cached,
            cached: true
          });
          continue;
        }

        const result = await tools.callTool(toolName, args, { signal });
        if (!validateToolResult(result)) {
          events.push({
            type: "tool_error",
            sequence: events.length,
            toolName,
            toolCallId: chunk.toolCallId ?? key,
            error: "tool returned malformed output",
            marker: "malformed_tool_output_handled"
          });
          continue;
        }

        await cache.set(key, result, TOOL_CACHE_TTL_MS);
        events.push({
          type: "tool_result",
          sequence: events.length,
          toolName,
          toolCallId: chunk.toolCallId ?? key,
          result,
          cached: false
        });
        continue;
      }

      if (chunk.type === "done") {
        usageTokens = chunk.usageTokens ?? usageTokens;
      }
    }
  } catch (error) {
    if (!isAbortError(error)) {
      throw error;
    }
    events.push({
      type: "aborted",
      sequence: events.length,
      error: "chat stream aborted",
      marker: "stream_abort_propagated"
    });
    events.push({ type: "done", sequence: events.length, usageTokens: 0 });
    return events;
  }

  await budget.consume(request.userId, usageTokens);
  events.push({ type: "done", sequence: events.length, usageTokens });
  return events;
}

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as ChatRequest;
  const events = await handleChat(payload);
  return Response.json({ events });
}

