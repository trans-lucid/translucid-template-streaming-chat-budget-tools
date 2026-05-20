# Streaming Chat Budget + Tool Use

You are joining a B2B AI support copilot team. The current chat endpoint waits for all model and tool work to finish, then returns one blocking response. Users do not see progress, repeated tool calls waste budget, and aborting the UI does not reliably stop backend work.

Repair the chat path so it behaves like a production streaming assistant.

## What To Build

- streaming response events in stable order
- tool-call lifecycle events
- abort propagation to model and tool work
- token/cost budget checks before model execution
- cache reuse for repeated tool calls
- controlled handling for malformed tool responses

## Local Simulator

`make dev` starts a local fake model and tool service. The public integration test uses this service through the same chat path you are expected to fix.

No external credentials are required. Do not call live model providers or cloud services.

## Main Files

- `src/app/api/chat/route.ts`
- `src/lib/fakeModel.ts`
- `src/lib/tools.ts`
- `src/lib/budget.ts`
- `src/lib/toolCache.ts`
- `src/components/ChatPanel.tsx`

## Commands

```bash
npm ci
make dev
make seed
make test
make test-integration
make run
make clean
```

## Deliverables

- passing public tests
- `results/chat_report.json`
- completed `DEBRIEF.md`

Private tests add harder abort, cache, malformed-tool, budget, and ordering cases.

