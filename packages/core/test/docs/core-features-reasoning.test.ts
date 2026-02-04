/**
 * Documentation Verification Tests: core-features/reasoning.md
 *
 * Verifies that all code examples from the Reasoning documentation work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  NodeLLM,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("core-features-reasoning", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider([{
      content: "The square root of 2 is irrational.",
      thinking: {
        text: "Let me prove this by contradiction...",
        tokens: 150
      }
    }]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Configuring Thinking", () => {
    it("withEffort() method exists", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.withEffort).toBe("function");
    });

    it("withEffort() accepts 'low' level", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withEffort("low");

      expect(chat).toBeDefined();
    });

    it("withEffort() accepts 'medium' level", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withEffort("medium");

      expect(chat).toBeDefined();
    });

    it("withEffort() accepts 'high' level", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withEffort("high");

      expect(chat).toBeDefined();
    });

    it("withThinking() method exists", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.withThinking).toBe("function");
    });

    it("ask() accepts thinking option per-request", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify the option is accepted
      const response = await chat.ask("Solve this puzzle", {
        thinking: { budget: 16000 }
      });

      expect(response).toBeDefined();
    });
  });

  describe("Accessing Thinking Results", () => {
    it("response.thinking property exists", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const response = await chat.ask("Prove that the square root of 2 is irrational.");

      // Response should have thinking property (from FakeProvider)
      expect(response).toBeDefined();
      expect(response.thinking).toBeDefined();
    });

    it("response.thinking.text contains thought process", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const response = await chat.ask("Test");

      if (response.thinking) {
        expect(typeof response.thinking.text).toBe("string");
      }
    });

    it("response.thinking.tokens contains token count", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const response = await chat.ask("Test");

      if (response.thinking) {
        expect(typeof response.thinking.tokens).toBe("number");
      }
    });

    it("response.content contains the final answer", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const response = await chat.ask("Test");

      expect(response.content).toBeDefined();
    });
  });

  describe("Streaming Thinking", () => {
    it("stream chunks can contain thinking property", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      for await (const chunk of chat.stream("Explain quantum entanglement")) {
        // Verify chunk structure
        expect(chunk).toHaveProperty("content");
        // Thinking may or may not be present in each chunk
      }
    });
  });

  describe("Backward Compatibility", () => {
    it("response.reasoning property exists (deprecated)", async () => {
      provider = new FakeProvider([{
        content: "Answer",
        reasoning: "Old-style reasoning text"
      }]);
      providerRegistry.register("fake", () => provider);

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const response = await chat.ask("Test");

      // Reasoning property should be accessible
      expect(response.reasoning).toBeDefined();
    });
  });
});
