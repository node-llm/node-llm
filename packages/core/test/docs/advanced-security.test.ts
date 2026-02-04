/**
 * Documentation Verification Tests: advanced/security.md
 *
 * Verifies that all security-related code examples work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("advanced-security", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["Test response"]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Content Policy Hooks", () => {
    it("chat.beforeRequest() hook exists and is chainable", () => {
      // Per docs: chat.beforeRequest(async (messages) => { ... })
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.beforeRequest).toBe("function");

      const result = chat.beforeRequest(async (messages) => {
        return messages;
      });

      expect(result).toBe(chat);
    });

    it("chat.afterResponse() hook exists and is chainable", () => {
      // Per docs: chat.afterResponse(async (response) => { ... })
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.afterResponse).toBe("function");

      const result = chat.afterResponse(async (response) => {
        return response;
      });

      expect(result).toBe(chat);
    });
  });

  describe("Observability Hooks", () => {
    it("onToolCallStart hook exists", () => {
      // Per docs: chat.onToolCallStart((call) => auditLog.info(...))
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.onToolCallStart).toBe("function");
    });

    it("onToolCallEnd hook exists", () => {
      // Per docs: chat.onToolCallEnd((call, result) => { ... })
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.onToolCallEnd).toBe("function");
    });

    it("onToolCallError hook exists", () => {
      // Per docs: chat.onToolCallError((call, err) => incidentResponse.trigger(...))
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.onToolCallError).toBe("function");
    });
  });

  describe("Tool Execution Policies", () => {
    it("withToolExecution accepts 'auto' mode", () => {
      // Per docs: chat.withToolExecution("auto")
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.withToolExecution).toBe("function");
      const result = chat.withToolExecution("auto");
      expect(result).toBe(chat);
    });

    it("withToolExecution accepts 'confirm' mode", () => {
      // Per docs: chat.withToolExecution("confirm")
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const result = chat.withToolExecution("confirm");
      expect(result).toBe(chat);
    });

    it("withToolExecution accepts 'dry-run' mode", () => {
      // Per docs: chat.withToolExecution("dry-run")
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const result = chat.withToolExecution("dry-run");
      expect(result).toBe(chat);
    });

    it("onConfirmToolCall hook exists", () => {
      // Per docs: chat.onConfirmToolCall(async (call) => { return true; })
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.onConfirmToolCall).toBe("function");
    });
  });

  describe("Loop Protection & Resource Limits", () => {
    it("requestTimeout option is accepted", () => {
      // Per docs: const llm = createLLM({ requestTimeout: 30000 });
      const llm = createLLM({
        provider: "fake",
        requestTimeout: 30000
      });
      expect(llm).toBeDefined();
    });

    it("maxToolCalls option is accepted", () => {
      // Per docs: const llm = createLLM({ maxToolCalls: 5 });
      const llm = createLLM({
        provider: "fake",
        maxToolCalls: 5
      });
      expect(llm).toBeDefined();
    });

    it("per-request requestTimeout override works", async () => {
      // Per docs: await chat.ask("...", { requestTimeout: 120000 });
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify the API accepts the option
      const response = await chat.ask("Test", { requestTimeout: 120000 });
      expect(response).toBeDefined();
    });

    it("per-request maxToolCalls override works", async () => {
      // Per docs: await chat.ask("...", { maxToolCalls: 10 });
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify the API accepts the option
      const response = await chat.ask("Test", { maxToolCalls: 10 });
      expect(response).toBeDefined();
    });
  });
});
