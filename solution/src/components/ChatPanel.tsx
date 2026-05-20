type ChatPanelProps = {
  initialMessage?: string;
};

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

