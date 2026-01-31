import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockLLM } from "../../src/Mocker.js";
import { NodeLLM, Middleware, providerRegistry } from "@node-llm/core";
import { MockProvider } from "../helpers/MockProvider.js";

describe("Mocker - Middleware Support", () => {
  let mocker: ReturnType<typeof mockLLM>;

  beforeEach(() => {
    providerRegistry.register("mock-provider", () => new MockProvider() as any);
    mocker = mockLLM();
  });

  afterEach(() => {
    mocker.clear();
  });

  it("should allow middlewares to be used with mocked LLM calls", async () => {
    mocker.chat("Hello").respond("Hi there!");

    const onRequest = vi.fn();
    const onResponse = vi.fn();

    const middleware: Middleware = {
      name: "TestMiddleware",
      onRequest,
      onResponse
    };

    const response = await NodeLLM.withProvider("mock-provider")
      .chat("gpt-4o-mini", {
        middlewares: [middleware]
      })
      .ask("Hello");

    expect(response.content).toBe("Hi there!");
    expect(onRequest).toHaveBeenCalledTimes(1);
    expect(onResponse).toHaveBeenCalledTimes(1);

    const ctx = onRequest.mock.calls[0]![0];
    expect(ctx.requestId).toBeDefined();
    expect(ctx.model).toBe("gpt-4o-mini");
  });

  it("should track middleware context across embed calls", async () => {
    mocker.embed(["test input"]).respond({
      vectors: [[0.1, 0.2, 0.3]]
    });

    const onRequest = vi.fn();
    const onResponse = vi.fn();

    const middleware: Middleware = {
      name: "EmbedMiddleware",
      onRequest,
      onResponse
    };

    const result = await NodeLLM.withProvider("mock-provider").embed(["test input"], {
      model: "text-embedding-ada-002",
      middlewares: [middleware]
    });

    expect(result.vectors).toHaveLength(1);
    expect(onRequest).toHaveBeenCalledTimes(1);
    expect(onResponse).toHaveBeenCalledTimes(1);

    const ctx = onRequest.mock.calls[0]![0];
    expect(ctx.requestId).toBeDefined();
    expect(ctx.provider).toBe("mock-provider");
  });

  it("should execute middleware error handlers when mock throws", async () => {
    mocker.chat("error test").respond({ error: new Error("Mock API error") });

    const onError = vi.fn();

    const middleware: Middleware = {
      name: "ErrorMiddleware",
      onError
    };

    await expect(
      NodeLLM.withProvider("mock-provider")
        .chat("gpt-4o-mini", {
          middlewares: [middleware]
        })
        .ask("error test")
    ).rejects.toThrow("Mock API error");

    expect(onError).toHaveBeenCalledTimes(1);
    const [ctx, error] = onError.mock.calls[0]!;
    expect(ctx.requestId).toBeDefined();
    expect(error.message).toBe("Mock API error");
  });

  it.skip("should support middleware with tool calls", async () => {
    mocker
      .chat("search for weather")
      .callsTool("get_weather", { location: "London" })
      .respond("The weather in London is sunny");

    const onToolCallStart = vi.fn();
    const onToolCallEnd = vi.fn();

    const middleware: Middleware = {
      name: "ToolMiddleware",
      onToolCallStart,
      onToolCallEnd
    };

    const tools = [
      {
        type: "function" as const,
        function: {
          name: "get_weather",
          description: "Get weather",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string" }
            }
          }
        },
        handler: async () => "Weather data"
      }
    ];

    await NodeLLM.withProvider("mock-provider")
      .chat("gpt-4o-mini", {
        middlewares: [middleware]
      })
      .withTools(tools)
      .ask("search for weather");

    expect(onToolCallStart).toHaveBeenCalledTimes(1);
    expect(onToolCallEnd).toHaveBeenCalledTimes(1);
  });

  it("should preserve mocker history when middlewares are used", async () => {
    mocker.chat("test").respond("response");

    const middleware: Middleware = {
      name: "HistoryMiddleware",
      onRequest: vi.fn()
    };

    await NodeLLM.withProvider("mock-provider")
      .chat("gpt-4o-mini", {
        middlewares: [middleware]
      })
      .ask("test");

    const history = mocker.history;
    expect(history).toHaveLength(1);
    expect(history[0]!.method).toBe("chat");
    expect(history[0]!.prompt).toBeDefined();
  });
});
