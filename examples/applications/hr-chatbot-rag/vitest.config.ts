import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      OPENAI_API_KEY: "sk-dummy-key-for-testing-only",
      GEMINI_API_KEY: "dummy-gemini-key",
      ANTHROPIC_API_KEY: "dummy-anthropic-key",
      // Dummy DB URL to prevent Prisma Client crash during initialization
      // even if we mock it later.
      DATABASE_URL: "postgresql://postgres:password@localhost:5432/hr_chatbot_test"
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
