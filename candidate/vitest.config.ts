import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/public/**/*.test.ts", "tests/public/**/*.test.tsx"],
    testTimeout: 20_000
  }
});
