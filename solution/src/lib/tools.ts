import type { ToolClient, ToolName } from "./types";

export class HttpToolClient implements ToolClient {
  constructor(private readonly baseUrl = "http://localhost:8095") {}

  async callTool(toolName: ToolName, args: Record<string, unknown>, options: { signal?: AbortSignal } = {}): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/tools/${toolName}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(args),
      signal: options.signal
    });
    if (!response.ok) {
      throw new Error(`tool_${toolName}_failed_${response.status}`);
    }
    return response.json();
  }
}

export function validateToolResult(value: unknown): value is { summary: string; evidence: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { summary?: unknown }).summary === "string" &&
    typeof (value as { evidence?: unknown }).evidence === "string"
  );
}

