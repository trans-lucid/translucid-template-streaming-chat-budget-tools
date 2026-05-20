# Rubric

## Strong

- Enforces budget before any model or tool execution.
- Uses streaming model output rather than a blocking completion.
- Emits stable event types for message start, tokens, tool calls, tool results/errors, abort, and done.
- Propagates abort signals to model streaming and skips tool work after abort.
- Caches validated tool results by stable request/tool arguments.
- Handles malformed tool output as controlled stream events.
- Preserves event ordering under interleaved tokens and tool calls.

## Partial

- Implements streaming but misses abort propagation or cache correctness.
- Enforces budget after some work has already started.
- Caches too broadly or without enough request context.
- Emits tool result events that are hard for the UI to reconcile.

## Weak

- Returns one final blocking response.
- Bypasses the local simulator in integration tests.
- Hardcodes public fixture behavior.
- Ignores budget, abort, or tool errors.

