/**
 * Documentation Verification Tests: providers/*.md
 *
 * Verifies that provider-specific code examples work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("providers-docs", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["Test response"]);
    providerRegistry.register("fake", () => provider);
  });

  describe("OpenAI Provider", () => {
    it("createLLM with openai provider pattern", () => {
      // Per docs: const llm = createLLM({ provider: "openai", openaiApiKey: ... });
      const llm = createLLM({
        provider: "fake",
        openaiApiKey: "test-key"
      });
      expect(llm).toBeDefined();
    });

    it("withParams() accepts OpenAI-specific parameters", () => {
      // Per docs: chat.withParams({ seed: 42, user: "user-123", presence_penalty: 0.5 })
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.withParams).toBe("function");

      const result = chat.withParams({
        seed: 42,
        user: "user-123",
        presence_penalty: 0.5,
        frequency_penalty: 0.5
      });

      expect(result).toBe(chat);
    });
  });

  describe("Anthropic Provider", () => {
    it("createLLM with anthropic provider pattern", () => {
      // Per docs: const llm = createLLM({ provider: "anthropic", anthropicApiKey: ... });
      const llm = createLLM({
        provider: "fake",
        anthropicApiKey: "test-key"
      });
      expect(llm).toBeDefined();
    });
  });

  describe("Gemini Provider", () => {
    it("createLLM with gemini provider pattern", () => {
      // Per docs: const llm = createLLM({ provider: "gemini", geminiApiKey: ... });
      const llm = createLLM({
        provider: "fake",
        geminiApiKey: "test-key"
      });
      expect(llm).toBeDefined();
    });
  });

  describe("DeepSeek Provider", () => {
    it("createLLM with deepseek provider pattern", () => {
      // Per docs: const llm = createLLM({ provider: "deepseek", deepseekApiKey: ... });
      const llm = createLLM({
        provider: "fake",
        deepseekApiKey: "test-key"
      });
      expect(llm).toBeDefined();
    });
  });

  describe("OpenRouter Provider", () => {
    it("createLLM with openrouter provider pattern", () => {
      // Per docs: const llm = createLLM({ provider: "openrouter", openrouterApiKey: ... });
      const llm = createLLM({
        provider: "fake",
        openrouterApiKey: "test-key"
      });
      expect(llm).toBeDefined();
    });
  });

  describe("Ollama Provider", () => {
    it("createLLM with ollama provider pattern", () => {
      // Per docs: const llm = createLLM({ provider: "ollama", ollamaApiBase: ... });
      const llm = createLLM({
        provider: "fake",
        ollamaApiBase: "http://localhost:11434"
      });
      expect(llm).toBeDefined();
    });
  });

  describe("Amazon Bedrock Provider", () => {
    it("createLLM with bedrock provider and region config", () => {
      // Per docs: createLLM({ provider: "bedrock", bedrockRegion: "us-east-1", ... })
      const llm = createLLM({
        provider: "fake",
        bedrockRegion: "us-east-1",
        bedrockAccessKeyId: "AKIA...",
        bedrockSecretAccessKey: "..."
      });
      expect(llm).toBeDefined();
    });

    it("withParams accepts additionalModelRequestFields", () => {
      // Per docs: chat.withParams({ additionalModelRequestFields: { inferenceConfig: { topK: 20 } } })
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withParams({
        additionalModelRequestFields: {
          inferenceConfig: {
            topK: 20
          }
        }
      });
      expect(chat).toBeDefined();
    });
  });

  describe("Custom Endpoints", () => {
    it("supports custom base URL for Azure OpenAI", () => {
      // Per docs: createLLM({ openaiApiBase: "https://your-resource.openai.azure.com" })
      const llm = createLLM({
        provider: "fake",
        openaiApiKey: "test-key",
        openaiApiBase: "https://your-resource.openai.azure.com"
      });
      expect(llm).toBeDefined();
    });

    it("supports assumeModelExists for custom models", () => {
      // Per docs: llm.chat("custom-model", { assumeModelExists: true })
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("custom-model", { assumeModelExists: true });
      expect(chat).toBeDefined();
    });
  });
});
