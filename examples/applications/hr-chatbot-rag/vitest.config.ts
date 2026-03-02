import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      // Use real API keys from .env file for VCR recording
      // Only set dummy database URL to prevent Prisma Client crash
      DATABASE_URL: "postgresql://postgres:password@localhost:5432/hr_chatbot_test"
    },
    server: {
      deps: {
        inline: [/@node-llm/],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@node-llm/core": path.resolve(__dirname, "../../../packages/core/dist/index.js"),
      "@node-llm/testing": path.resolve(__dirname, "../../../packages/testing/dist/index.js"),
    },
  },
});
