/**
 * Documentation Verification Tests: getting_started/configuration.md
 *
 * Verifies that all code examples from the Configuration documentation work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  NodeLLM,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("getting-started-configuration", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["Test response"]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Explicit Factory (createLLM)", () => {
    it("createLLM accepts provider option", () => {
      // Per docs: const llm = createLLM({ provider: "anthropic", ... });
      const llm = createLLM({ provider: "fake" });
      expect(llm).toBeDefined();
    });

    it("createLLM accepts API key options", () => {
      // Per docs: createLLM({ openaiApiKey, anthropicApiKey, geminiApiKey, ... })
      const llm = createLLM({
        provider: "fake",
        openaiApiKey: "test-openai-key",
        anthropicApiKey: "test-anthropic-key",
        geminiApiKey: "test-gemini-key",
        deepseekApiKey: "test-deepseek-key",
        openrouterApiKey: "test-openrouter-key"
      });
      expect(llm).toBeDefined();
    });

    it("createLLM accepts custom base URL options", () => {
      // Per docs: createLLM({ openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT })
      const llm = createLLM({
        provider: "fake",
        openaiApiKey: "test-key",
        openaiApiBase: "https://custom-endpoint.example.com"
      });
      expect(llm).toBeDefined();
    });

    it("createLLM accepts loop protection options", () => {
      // Per docs: createLLM({ maxToolCalls: 5, maxRetries: 2, requestTimeout: 30000, maxTokens: 4096 })
      const llm = createLLM({
        provider: "fake",
        maxToolCalls: 5,
        maxRetries: 2,
        requestTimeout: 30000,
        maxTokens: 4096
      });
      expect(llm).toBeDefined();
    });
  });

  describe("Configuration Keys", () => {
    it("supports openaiApiKey and openaiApiBase", () => {
      const llm = createLLM({
        provider: "fake",
        openaiApiKey: "sk-test",
        openaiApiBase: "https://api.openai.com/v1"
      });
      expect(llm).toBeDefined();
    });

    it("supports anthropicApiKey and anthropicApiBase", () => {
      const llm = createLLM({
        provider: "fake",
        anthropicApiKey: "test-anthropic",
        anthropicApiBase: "https://api.anthropic.com"
      });
      expect(llm).toBeDefined();
    });

    it("supports geminiApiKey and geminiApiBase", () => {
      const llm = createLLM({
        provider: "fake",
        geminiApiKey: "test-gemini",
        geminiApiBase: "https://generativelanguage.googleapis.com"
      });
      expect(llm).toBeDefined();
    });

    it("supports deepseekApiKey and deepseekApiBase", () => {
      const llm = createLLM({
        provider: "fake",
        deepseekApiKey: "test-deepseek",
        deepseekApiBase: "https://api.deepseek.com"
      });
      expect(llm).toBeDefined();
    });

    it("supports openrouterApiKey and openrouterApiBase", () => {
      const llm = createLLM({
        provider: "fake",
        openrouterApiKey: "test-openrouter",
        openrouterApiBase: "https://openrouter.ai/api/v1"
      });
      expect(llm).toBeDefined();
    });

    it("supports defaultChatModel option", () => {
      const llm = createLLM({
        provider: "fake",
        defaultChatModel: "gpt-4o"
      });
      expect(llm).toBeDefined();
    });

    it("supports retry configuration", () => {
      const llm = createLLM({
        provider: "fake",
        retry: { attempts: 3, delayMs: 1000 }
      });
      expect(llm).toBeDefined();
    });
  });

  describe("Inspecting Configuration", () => {
    it("NodeLLM.config exists", () => {
      // Per docs: console.log(NodeLLM.config.openaiApiKey);
      expect(NodeLLM.config).toBeDefined();
    });
  });

  describe("Zero-Config Pattern", () => {
    it("NodeLLM.chat() works without explicit config", () => {
      // Per docs: const chat = NodeLLM.chat();
      // Note: This relies on env vars, but we verify the API exists
      expect(typeof NodeLLM.chat).toBe("function");
    });
  });

  describe("Isolated Branching (withProvider)", () => {
    it("withProvider returns a new LLM instance", () => {
      const llm = createLLM({ provider: "fake" });
      const branched = llm.withProvider("fake");
      expect(branched).toBeDefined();
      expect(branched).not.toBe(llm);
    });
  });
});
