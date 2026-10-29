import { defineConfig } from "vitest/config";

// Real calls to real providers, kept out of `vitest run`: run with `pnpm test:live`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/live/**/*.live.ts"],
    testTimeout: 60_000,
    fileParallelism: false
  }
});
