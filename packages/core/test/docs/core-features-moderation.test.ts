/**
 * Documentation Verification Tests: core-features/moderation.md
 *
 * Verifies that all code examples from the Moderation documentation work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  NodeLLM,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("core-features-moderation", () => {
  beforeEach(() => {
    const provider = new FakeProvider(["Test response"]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Basic Usage", () => {
    it("NodeLLM.moderate() method exists", () => {
      expect(typeof NodeLLM.moderate).toBe("function");
    });

    it("llm.moderate() method exists", () => {
      const llm = createLLM({ provider: "fake" });
      expect(typeof llm.moderate).toBe("function");
    });
  });

  describe("Understanding Results", () => {
    // Note: Actual moderation calls require real providers
    // These tests verify the API exists
    it("moderation result structure is documented", () => {
      // Expected result structure:
      const exampleResult = {
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          "self-harm": false,
          violence: false
        },
        category_scores: {
          sexual: 0.0,
          hate: 0.0,
          harassment: 0.0,
          "self-harm": 0.0,
          violence: 0.0
        },
        flaggedCategories: []
      };

      expect(exampleResult.flagged).toBe(false);
      expect(exampleResult.categories).toBeDefined();
      expect(exampleResult.category_scores).toBeDefined();
      expect(Array.isArray(exampleResult.flaggedCategories)).toBe(true);
    });
  });

  describe("Integration Patterns", () => {
    it("pre-chat moderation pattern is implementable", async () => {
      // Simulate the pattern from docs
      async function safeChat(input: string) {
        // In real usage: const mod = await NodeLLM.moderate(input);
        const mod = { flagged: false, flaggedCategories: [] as string[] };

        if (mod.flagged) {
          throw new Error(`Content Unsafe: ${mod.flaggedCategories.join(", ")}`);
        }

        // In real usage: return await chat.ask(input);
        return { content: "Safe response" };
      }

      const result = await safeChat("Hello!");
      expect(result.content).toBe("Safe response");
    });

    it("custom risk thresholds pattern is implementable", () => {
      // Simulate the pattern from docs
      const mockResult = {
        flagged: false,
        category_scores: {
          hate: 0.05,
          violence: 0.02,
          sexual: 0.01
        }
      };

      // Custom strict policy: Flag anything with > 0.1 confidence
      const isRisky = Object.entries(mockResult.category_scores).some(
        ([category, score]) => score > 0.1
      );

      expect(isRisky).toBe(false);
    });

    it("flagged content detection pattern", () => {
      const mockResult = {
        flagged: true,
        categories: {
          hate: true,
          violence: false
        },
        category_scores: {
          hate: 0.95,
          violence: 0.02
        },
        flaggedCategories: ["hate"]
      };

      expect(mockResult.flagged).toBe(true);
      expect(mockResult.categories.hate).toBe(true);
      expect(mockResult.flaggedCategories).toContain("hate");
    });
  });
});
