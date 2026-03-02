import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@node-llm/core": path.resolve(__dirname, "../core/dist/index.js")
    }
  },
  test: {
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/test/jest/**" // Exclude Jest test directory
    ]
  }
});
