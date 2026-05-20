import type { ChatRequest, ModelChunk, ModelClient } from "./types";

export class HttpModelClient implements ModelClient {
  constructor(private readonly baseUrl = "http://localhost:8095") {}

  async complete(request: ChatRequest, options: { signal?: AbortSignal } = {}): Promise<{ text: string; usageTokens: number }> {
    const response = await fetch(`${this.baseUrl}/model/complete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal: options.signal
    });
    if (!response.ok) {
      throw new Error(`model_complete_failed_${response.status}`);
    }
    return response.json() as Promise<{ text: string; usageTokens: number }>;
  }

  async *stream(request: ChatRequest, options: { signal?: AbortSignal } = {}): AsyncIterable<ModelChunk> {
    const response = await fetch(`${this.baseUrl}/model/stream`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal: options.signal
    });
    if (!response.ok) {
      throw new Error(`model_stream_failed_${response.status}`);
    }
    const text = await response.text();
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      if (options.signal?.aborted) {
        throw new DOMException("aborted", "AbortError");
      }
      yield JSON.parse(line) as ModelChunk;
    }
  }
}

export class ScriptedModelClient implements ModelClient {
  public completeCalls = 0;
  public streamCalls = 0;

  constructor(private readonly chunks: ModelChunk[] = defaultChunks()) {}

  async complete(): Promise<{ text: string; usageTokens: number }> {
    this.completeCalls += 1;
    return { text: "I checked everything after the full model call finished.", usageTokens: 80 };
  }

  async *stream(_request: ChatRequest, options: { signal?: AbortSignal } = {}): AsyncIterable<ModelChunk> {
    this.streamCalls += 1;
    for (const chunk of this.chunks) {
      if (options.signal?.aborted) {
        throw new DOMException("aborted", "AbortError");
      }
      yield chunk;
    }
  }
}

export function defaultChunks(): ModelChunk[] {
  return [
    { type: "token", text: "Checking " },
    { type: "token", text: "the account " },
    { type: "tool_call", toolName: "weather", toolCallId: "tool-weather-public" },
    { type: "token", text: "with current tool context." },
    { type: "done", usageTokens: 72 }
  ];
}

