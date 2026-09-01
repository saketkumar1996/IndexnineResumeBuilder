import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    // Suites share one in-memory Mongo instance per file; running files
    // sequentially keeps them off each other's collections.
    fileParallelism: false,
    testTimeout: 30000,
    // The first run may download the in-memory MongoDB binary.
    hookTimeout: 180000,
  },
});
