import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLLM } from "../../../src/llm.js";
import { FakeProvider } from "../../fake-provider.js";
import { Middleware } from "../../../src/types/Middleware.js";

describe("Global Middleware Inheritance", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["Response"]);
  });

  it("should merge global and local middlewares in correct order", async () => {
    const callOrder: string[] = [];

    const globalM: Middleware = {
      name: "Global",
      onRequest: async () => {
        callOrder.push("global:request");
      }
    };

    const localM: Middleware = {
      name: "Local",
      onRequest: async () => {
        callOrder.push("local:request");
      }
    };

    const llm = createLLM({
      provider,
      middlewares: [globalM]
    });

    const chat = llm.chat("test-model", { middlewares: [localM] });
    await chat.ask("hi");

    // Global must run before Local
    expect(callOrder).toEqual(["global:request", "local:request"]);
  });

  it("should preserve global middlewares across withProvider() calls", async () => {
    const onRequest = vi.fn();
    const globalM: Middleware = {
      name: "Global",
      onRequest
    };

    const llm = createLLM({
      provider,
      middlewares: [globalM]
    });

    // Switch provider, it should still have the global middleware
    const llm2 = llm.withProvider("openai", { openaiApiKey: "test" });

    expect(llm2.middlewares).toContain(globalM);
  });
});
