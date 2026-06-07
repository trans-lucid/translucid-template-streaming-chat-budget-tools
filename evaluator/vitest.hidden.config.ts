import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["solution/tests/**/*.test.ts", "evaluator/tests_hidden/**/*.test.ts"],
    testTimeout: 20_000
  }
});
