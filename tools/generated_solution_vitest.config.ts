import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: [
      "tests/public/**/*.test.ts",
      "tests/public/**/*.test.tsx",
      "solution/tests/**/*.test.ts",
      "evaluator/tests_hidden/**/*.test.ts"
    ],
    testTimeout: 20_000
  }
});
