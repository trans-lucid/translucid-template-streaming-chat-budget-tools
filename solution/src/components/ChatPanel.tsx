import type { ChatEvent } from "../lib/types";

export type ChatPanelToolState = "idle" | "loading" | "done" | "error";

export interface ChatPanelState {
  transcript: string;
  toolStatus: ChatPanelToolState;
  toolName?: string;
  toolResult?: string;
  cachedToolResult: boolean;
  aborted: boolean;
  error?: string;
  done: boolean;
}

type ChatPanelProps = {
  initialMessage?: string;
};

export function createInitialChatPanelState(): ChatPanelState {
  return {
    transcript: "",
    toolStatus: "idle",
    cachedToolResult: false,
    aborted: false,
    done: false
  };
}

function renderToolResult(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "summary" in result) {
    return String((result as { summary: unknown }).summary);
  }
  return JSON.stringify(result);
}

export function applyChatEvent(state: ChatPanelState, event: ChatEvent): ChatPanelState {
  if (event.type === "message_start") {
    return { ...state, error: undefined, done: false };
  }
  if (event.type === "token") {
    return { ...state, transcript: `${state.transcript}${event.text ?? ""}` };
  }
  if (event.type === "tool_call") {
    return {
      ...state,
      toolStatus: "loading",
      toolName: event.toolName,
      error: undefined
    };
  }
  if (event.type === "tool_result") {
    return {
      ...state,
      toolStatus: "done",
      toolName: event.toolName,
      toolResult: renderToolResult(event.result),
      cachedToolResult: state.cachedToolResult || event.cached === true,
      error: undefined
    };
  }
  if (event.type === "tool_error") {
    return {
      ...state,
      toolStatus: "error",
      toolName: event.toolName,
      error: event.error ?? "tool output could not be used"
    };
  }
  if (event.type === "budget_error") {
    return { ...state, error: event.error ?? "budget exceeded", done: true };
  }
  if (event.type === "aborted") {
    return {
      ...state,
      aborted: true,
      error: event.error ?? "chat stream aborted",
      toolStatus: state.toolStatus === "loading" ? "error" : state.toolStatus
    };
  }
  if (event.type === "done") {
    return { ...state, done: true };
  }
  return state;
}

export function applyChatEvents(events: ChatEvent[], initial = createInitialChatPanelState()): ChatPanelState {
  return events.reduce((state, event) => applyChatEvent(state, event), initial);
}

export function ChatPanel({ initialMessage = "" }: ChatPanelProps) {
  return (
    <main>
      <h1>Support Copilot</h1>
      <textarea aria-label="Message" defaultValue={initialMessage} />
      <button type="button">Send</button>
      <button type="button">Abort</button>
      <section aria-label="Assistant response" />
    </main>
  );
}
