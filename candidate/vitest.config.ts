import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/public/**/*.test.ts"],
    testTimeout: 20_000
  }
});

