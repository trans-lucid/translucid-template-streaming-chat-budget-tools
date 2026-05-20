export type ToolName = "weather" | "account";

export type ChatEventType =
  | "message_start"
  | "token"
  | "tool_call"
  | "tool_result"
  | "tool_error"
  | "budget_error"
  | "aborted"
  | "done";

export interface ChatRequest {
  sessionId: string;
  userId: string;
  message: string;
  toolName?: ToolName;
}

export interface ChatEvent {
  type: ChatEventType;
  sequence: number;
  text?: string;
  toolName?: ToolName;
  toolCallId?: string;
  result?: unknown;
  cached?: boolean;
  error?: string;
  marker?: string;
  usageTokens?: number;
}

export interface ModelChunk {
  type: "token" | "tool_call" | "done";
  text?: string;
  toolName?: ToolName;
  toolCallId?: string;
  usageTokens?: number;
}

export interface ModelClient {
  complete(request: ChatRequest, options?: { signal?: AbortSignal }): Promise<{ text: string; usageTokens: number }>;
  stream(request: ChatRequest, options?: { signal?: AbortSignal }): AsyncIterable<ModelChunk>;
}

export interface ToolClient {
  callTool(toolName: ToolName, args: Record<string, unknown>, options?: { signal?: AbortSignal }): Promise<unknown>;
}

export interface BudgetStore {
  remaining(userId: string): Promise<number>;
  consume(userId: string, tokens: number): Promise<void>;
}

export interface ToolCache {
  get(key: string): Promise<unknown | undefined>;
  set(key: string, value: unknown, ttlMs?: number): Promise<void>;
}

export interface ChatRuntimeOptions {
  simulatorBaseUrl?: string;
  modelClient?: ModelClient;
  toolClient?: ToolClient;
  budgetStore?: BudgetStore;
  toolCache?: ToolCache;
  signal?: AbortSignal;
}

