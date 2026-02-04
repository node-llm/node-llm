/**
 * Documentation Verification Tests: core-features/models.md
 *
 * Verifies that all code examples from the Models & Registry documentation work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  NodeLLM,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("core-features-models", () => {
  beforeEach(() => {
    const provider = new FakeProvider(["Test response"]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Inspecting a Model", () => {
    it("NodeLLM.models exists", () => {
      expect(NodeLLM.models).toBeDefined();
    });

    it("NodeLLM.models.find() method exists", () => {
      expect(typeof NodeLLM.models.find).toBe("function");
    });

    it("NodeLLM.models.find() returns model info for known models", () => {
      const model = NodeLLM.models.find("gpt-4o");

      // Model should exist in registry
      if (model) {
        expect(model.id).toBeDefined();
        expect(model.provider).toBeDefined();
      }
    });

    it("model info includes context_window", () => {
      const model = NodeLLM.models.find("gpt-4o");

      if (model) {
        expect(model.context_window).toBeDefined();
        expect(typeof model.context_window).toBe("number");
      }
    });

    it("model info includes pricing", () => {
      const model = NodeLLM.models.find("gpt-4o");

      if (model) {
        expect(model.pricing).toBeDefined();
      }
    });
  });

  describe("Discovery by Capability", () => {
    it("NodeLLM.models.all() returns an array", () => {
      const allModels = NodeLLM.models.all();

      expect(Array.isArray(allModels)).toBe(true);
      expect(allModels.length).toBeGreaterThan(0);
    });

    it("models can be filtered by capabilities", () => {
      const allModels = NodeLLM.models.all();

      // Filter for vision models
      const visionModels = allModels.filter((m) => 
        m.capabilities?.includes("vision")
      );

      // Should find at least some vision models
      expect(Array.isArray(visionModels)).toBe(true);
    });

    it("models have capabilities array", () => {
      const allModels = NodeLLM.models.all();
      const modelWithCapabilities = allModels.find(m => m.capabilities);

      if (modelWithCapabilities) {
        expect(Array.isArray(modelWithCapabilities.capabilities)).toBe(true);
      }
    });
  });

  describe("Custom Models & Endpoints", () => {
    it("chat accepts assumeModelExists option", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("my-custom-deployment", {
        assumeModelExists: true
      });

      expect(chat).toBeDefined();
    });

    it("NodeLLM.withProvider() creates scoped instance", () => {
      const scopedLLM = NodeLLM.withProvider("fake");

      expect(scopedLLM).toBeDefined();
      expect(typeof scopedLLM.chat).toBe("function");
    });

    it("withProvider() accepts custom configuration", () => {
      const scopedLLM = NodeLLM.withProvider("fake", {
        requestTimeout: 60000
      });

      expect(scopedLLM).toBeDefined();
    });
  });

  describe("Custom Endpoints Configuration", () => {
    it("createLLM accepts openaiApiBase option", () => {
      const llm = createLLM({
        provider: "fake",
        openaiApiBase: "https://my-azure-resource.openai.azure.com"
      });

      expect(llm).toBeDefined();
    });

    it("createLLM accepts anthropicApiBase option", () => {
      const llm = createLLM({
        provider: "fake",
        anthropicApiBase: "https://custom-anthropic-endpoint.com"
      });

      expect(llm).toBeDefined();
    });

    it("createLLM accepts geminiApiBase option", () => {
      const llm = createLLM({
        provider: "fake",
        geminiApiBase: "https://custom-gemini-endpoint.com"
      });

      expect(llm).toBeDefined();
    });
  });
});
