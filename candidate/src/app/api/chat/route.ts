import { InMemoryBudgetStore } from "../../../lib/budget";
import { HttpModelClient } from "../../../lib/fakeModel";
import { HttpToolClient } from "../../../lib/tools";
import type { ChatEvent, ChatRequest, ChatRuntimeOptions } from "../../../lib/types";

export async function handleChat(request: ChatRequest, options: ChatRuntimeOptions = {}): Promise<ChatEvent[]> {
  const baseUrl = options.simulatorBaseUrl ?? "http://localhost:8095";
  const model = options.modelClient ?? new HttpModelClient(baseUrl);
  const tools = options.toolClient ?? new HttpToolClient(baseUrl);
  const budget = options.budgetStore ?? new InMemoryBudgetStore();

  const events: ChatEvent[] = [{ type: "message_start", sequence: 0, text: request.message }];

  // Starter bug: this calls the non-streaming model path and only checks budget afterward.
  const completion = await model.complete(request, { signal: options.signal });

  let text = completion.text;
  if (request.toolName) {
    const result = await tools.callTool(
      request.toolName,
      { sessionId: request.sessionId, userId: request.userId, prompt: request.message },
      { signal: options.signal }
    );
    events.push({
      type: "tool_result",
      sequence: events.length,
      toolName: request.toolName,
      toolCallId: `tool-${request.toolName}`,
      result,
      cached: false
    });
    text += ` ${JSON.stringify(result)}`;
  }

  await budget.consume(request.userId, completion.usageTokens);

  events.push({ type: "token", sequence: events.length, text, usageTokens: completion.usageTokens });
  events.push({ type: "done", sequence: events.length, usageTokens: completion.usageTokens });
  return events;
}

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as ChatRequest;
  const events = await handleChat(payload);
  return Response.json({ events });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const events = await handleChat({
    sessionId: "local-demo",
    userId: "local-user",
    message: "Check the weather before the customer call.",
    toolName: "weather"
  });
  console.log(JSON.stringify({ events }, null, 2));
}

