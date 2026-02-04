/**
 * Documentation Verification Tests: core-features/chat.md
 *
 * Verifies that all code examples from the Chat documentation work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createLLM,
  NodeLLM,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("core-features-chat", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["The capital of France is Paris."]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Starting a Conversation", () => {
    it("NodeLLM.chat() returns a chat instance", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(chat).toBeDefined();
      expect(typeof chat.ask).toBe("function");
    });

    it("chat.ask() returns a response with content", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const response = await chat.ask("What is the capital of France?");

      expect(response.content).toBe("The capital of France is Paris.");
    });

    it("continuing the conversation maintains history", async () => {
      provider = new FakeProvider([
        "Paris",
        "The population of Paris is approximately 2.1 million."
      ]);
      providerRegistry.register("fake", () => provider);

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      await chat.ask("What is the capital of France?");
      await chat.ask("What is the population there?");

      // History should have 4 messages (2 user + 2 assistant)
      expect(chat.history.length).toBe(4);
    });
  });

  describe("System Prompts (Instructions)", () => {
    it("accepts systemPrompt at initialization", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model", {
        systemPrompt: "You are a helpful assistant that answers in rhyming couplets."
      });

      expect(chat).toBeDefined();
    });

    it("withInstructions() method exists and is chainable", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");
      const result = chat.withInstructions("Now speak like a pirate.");

      expect(result).toBe(chat);
    });

    it("system() method exists and is chainable (v1.6.0)", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");
      const result = chat.system("You are a helpful assistant.");

      expect(result).toBe(chat);
    });
  });

  describe("Manual History Management (v1.6.0)", () => {
    it("add() method accepts role and content", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Rehydrate previous turns from DB
      const result = chat
        .add("user", "What is my name?")
        .add("assistant", "You told me your name is Alice.");

      expect(result).toBe(chat);
      expect(chat.history.length).toBe(2);
    });

    it("add() returns the chat instance for chaining", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const result = chat.add("user", "Test message");

      expect(result).toBe(chat);
    });
  });

  describe("Custom HTTP Headers", () => {
    it("withRequestOptions() accepts headers", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withRequestOptions({
        headers: {
          "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15"
        }
      });

      expect(chat).toBeDefined();
    });
  });

  describe("Working with Multiple Providers", () => {
    it("createLLM() creates isolated instances", () => {
      const userA = createLLM({ provider: "fake" });
      const userB = createLLM({ provider: "fake" });

      expect(userA).toBeDefined();
      expect(userB).toBeDefined();
      expect(userA).not.toBe(userB);
    });

    it("NodeLLM.withProvider() creates scoped instances", () => {
      const tenant1 = NodeLLM.withProvider("fake", {
        requestTimeout: 30000
      });
      const tenant2 = NodeLLM.withProvider("fake", {
        requestTimeout: 60000
      });

      expect(tenant1).toBeDefined();
      expect(tenant2).toBeDefined();
      expect(tenant1).not.toBe(tenant2);
    });
  });

  describe("Temperature & Creativity", () => {
    it("withTemperature() accepts a number and is chainable", () => {
      const llm = createLLM({ provider: "fake" });

      const factual = llm.chat("fake-model").withTemperature(0.0);
      const creative = llm.chat("fake-model").withTemperature(0.9);

      expect(factual).toBeDefined();
      expect(creative).toBeDefined();
    });
  });

  describe("Lifecycle Events", () => {
    it("onNewMessage() hook exists", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.onNewMessage).toBe("function");
    });

    it("onToolCallStart() hook exists", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.onToolCallStart).toBe("function");
    });

    it("onToolCallEnd() hook exists", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.onToolCallEnd).toBe("function");
    });

    it("onToolCallError() hook exists", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.onToolCallError).toBe("function");
    });

    it("onEndMessage() hook exists", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.onEndMessage).toBe("function");
    });

    it("lifecycle hooks are chainable", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm
        .chat("fake-model")
        .onNewMessage(() => {})
        .onToolCallStart(() => {})
        .onToolCallEnd(() => {})
        .onToolCallError(() => {})
        .onEndMessage(() => {});

      expect(chat).toBeDefined();
    });
  });

  describe("Content Policy Hooks", () => {
    it("beforeRequest() hook exists", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.beforeRequest).toBe("function");
    });

    it("afterResponse() hook exists", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.afterResponse).toBe("function");
    });

    it("beforeRequest() and afterResponse() are chainable", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm
        .chat("fake-model")
        .beforeRequest(async (messages) => messages)
        .afterResponse(async (response) => {});

      expect(chat).toBeDefined();
    });
  });

  describe("Retry Logic & Safety", () => {
    it("createLLM accepts maxRetries option", () => {
      const llm = createLLM({
        provider: "fake",
        maxRetries: 3
      });

      expect(llm).toBeDefined();
    });

    it("createLLM accepts maxToolCalls option", () => {
      const llm = createLLM({
        provider: "fake",
        maxToolCalls: 10
      });

      expect(llm).toBeDefined();
    });

    it("createLLM accepts requestTimeout option", () => {
      const llm = createLLM({
        provider: "fake",
        requestTimeout: 60000
      });

      expect(llm).toBeDefined();
    });

    it("ask() accepts requestTimeout option per-request", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // This should not throw - verifying the option is accepted
      const response = await chat.ask("Test", {
        requestTimeout: 120000
      });

      expect(response).toBeDefined();
    });
  });

  describe("Request Cancellation (v1.5.3+)", () => {
    it("ask() accepts AbortController signal option", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");
      const controller = new AbortController();

      // Verify the signal option is accepted
      const response = await chat.ask("Test", {
        signal: controller.signal
      });

      expect(response).toBeDefined();
    });
  });
});
