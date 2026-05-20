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

export function applyChatEvent(state: ChatPanelState, event: ChatEvent): ChatPanelState {
  if (event.type === "token") {
    return { ...state, transcript: `${state.transcript}${event.text ?? ""}` };
  }
  if (event.type === "done") {
    return { ...state, done: true };
  }

  // Starter bug: the UI reducer ignores tool lifecycle, abort, and controlled error events.
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
