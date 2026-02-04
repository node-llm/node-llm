/**
 * Documentation Verification Tests: advanced/debugging.md
 *
 * Verifies that debugging and logging patterns from docs work correctly.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createLLM, NodeLLM, providerRegistry } from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("advanced-debugging", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["Debug test response"]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Debug Mode", () => {
    it("createLLM accepts debug option", () => {
      // Per docs: const llm = createLLM({ debug: true });
      const llm = createLLM({ debug: true });
      expect(llm).toBeDefined();
    });

    it("createLLM accepts debug: false", () => {
      const llm = createLLM({ debug: false });
      expect(llm).toBeDefined();
    });

    it("scoped debug mode with withProvider pattern", () => {
      // Per docs: NodeLLM.withProvider("anthropic", { debug: true })
      const scopedInstance = NodeLLM.withProvider("fake", { debug: true });
      expect(scopedInstance).toBeDefined();
    });
  });

  describe("Debug Coverage", () => {
    it("debug mode works with chat", async () => {
      // Per docs: Debug logging works for Chat (regular and streaming)
      const llm = createLLM({ provider: "fake", debug: true });
      const chat = llm.chat("fake-model");

      const response = await chat.ask("Test");
      expect(response).toBeDefined();
    });

    it("debug mode works with streaming", async () => {
      // Per docs: Debug logging works for Chat (regular and streaming)
      const llm = createLLM({ provider: "fake", debug: true });
      const stream = llm.chat("fake-model").stream("Test");

      // Consume stream
      let content = "";
      for await (const chunk of stream) {
        content += chunk.content || "";
      }
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe("Lifecycle Handlers for Observability", () => {
    it("onNewMessage handler pattern compiles", async () => {
      // Per docs: chat.onNewMessage(() => logger.info("Chat started"))
      const llm = createLLM({ provider: "fake" });
      const logs: string[] = [];

      const chat = llm
        .chat("fake-model")
        .onNewMessage(() => logs.push("Chat started"));

      await chat.ask("Test");

      expect(logs).toContain("Chat started");
    });

    it("onEndMessage handler pattern compiles", async () => {
      // Per docs: .onEndMessage((res) => logger.info("Chat finished", { tokens: res.total_tokens }))
      const llm = createLLM({ provider: "fake" });
      const logs: { message: string; tokens?: number }[] = [];

      const chat = llm.chat("fake-model").onEndMessage((res) =>
        logs.push({
          message: "Chat finished",
          tokens: res.total_tokens
        })
      );

      await chat.ask("Test");

      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe("Chat finished");
    });

    it("chained lifecycle handlers pattern", async () => {
      // Per docs: chat.onNewMessage(...).onEndMessage(...)
      const llm = createLLM({ provider: "fake" });
      const logs: string[] = [];

      const chat = llm
        .chat("fake-model")
        .onNewMessage(() => logs.push("started"))
        .onEndMessage(() => logs.push("finished"));

      await chat.ask("Test");

      expect(logs).toContain("started");
      expect(logs).toContain("finished");
    });
  });
});
