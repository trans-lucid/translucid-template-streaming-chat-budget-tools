#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -d "$ROOT/generated/main" ] || [ ! -d "$ROOT/generated/solution" ]; then
  python3 "$ROOT/tools/render_template.py"
fi

python3 "$ROOT/tools/scan_safety.py" "$ROOT/generated/main"

cd "$ROOT/generated/main"
npm ci
set +e
MAIN_OUTPUT="$(npm run test:unit 2>&1)"
MAIN_STATUS=$?
set -e
printf '%s\n' "$MAIN_OUTPUT"
if [ "$MAIN_STATUS" -eq 0 ]; then
  echo "rendered main unexpectedly passed starter public unit tests" >&2
  exit 1
fi
if ! grep -Eq "streaming_not_implemented|budget_exceeded_without_guard|tool_cache_miss|ui_stream_state_missing|tool_ui_state_missing|abort_ui_state_missing" <<<"$MAIN_OUTPUT"; then
  echo "rendered main failed without an expected marker" >&2
  exit 1
fi

cd "$ROOT/generated/solution"
npm ci
EVAL_TARGET="$PWD/solution" npx vitest run --config vitest.config.ts tests/public/public.test.ts tests/public/ui-state.test.tsx solution/tests/*.test.ts evaluator/tests_hidden/*.test.ts

echo "rendered smoke validation passed"
