#!/usr/bin/env bash
set -euo pipefail

if ! find evaluator/tests_hidden -name '*.test.ts' -print -quit | grep -q .; then
  echo "no hidden tests discovered" >&2
  exit 1
fi
if [ -d "$(pwd)/src" ]; then
  TARGET="${EVAL_TARGET:-$(pwd)}"
else
  TARGET="${EVAL_TARGET:-$(pwd)/solution}"
fi
EVAL_TARGET="$TARGET" npx vitest run --config evaluator/vitest.hidden.config.ts evaluator/tests_hidden/*.test.ts
