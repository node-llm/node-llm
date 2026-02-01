import { describe, it, expect, vi, beforeEach } from "vitest";
import { NodeLLM, createLLM } from "../../../src/llm.js";
import { FakeProvider } from "../../fake-provider.js";
import { Middleware, MiddlewareContext } from "../../../src/types/Middleware.js";
import { Embedding } from "../../../src/embedding/Embedding.js";

// Extended FakeProvider to support test helpers for embeddings
class TestProvider extends FakeProvider {
  public embedCalls: any[] = [];

  constructor() {
    super([]);
  }

  async embed(request: any) {
    this.embedCalls.push(request);
    return {
      vectors: [[0.1, 0.2, 0.3]],
      model: request.model,
      input_tokens: 10,
      dimensions: 3
    };
  }
}

describe("Embedding Middleware", () => {
  let provider: TestProvider;
  let llm: any;

  beforeEach(() => {
    provider = new TestProvider();
    llm = createLLM({ provider });
  });

  describe("Lifecycle Hooks", () => {
    it("should execute onRequest before the provider call", async () => {
      const onRequest = vi.fn();
      const middleware: Middleware = {
        name: "TestMiddleware",
        onRequest
      };

      await llm.embed("input text", {
        model: "test-model",
        middlewares: [middleware]
      });

      expect(onRequest).toHaveBeenCalledTimes(1);
      const ctx = onRequest.mock.calls[0]![0] as MiddlewareContext;

      expect(ctx.provider).toBe("fake");
      expect(ctx.model).toBe("test-model");
      expect(ctx.input).toBe("input text");
      expect(ctx.requestId).toBeDefined();
    });

    it("should execute onResponse after the provider call", async () => {
      const onResponse = vi.fn();
      const middleware: Middleware = {
        name: "TestMiddleware",
        onResponse
      };

      await llm.embed("input text", {
        model: "test-model",
        middlewares: [middleware]
      });

      expect(onResponse).toHaveBeenCalledTimes(1);
      const args = onResponse.mock.calls[0]!;
      const ctx = args[0] as MiddlewareContext;
      const result = args[1] as Embedding;

      expect(ctx.requestId).toBeDefined();
      expect(result).toBeInstanceOf(Embedding);
      expect(result.vectors).toHaveLength(1);
      expect(result.model).toBe("test-model");
    });

    it("should allow modifying input in onRequest", async () => {
      const modifier: Middleware = {
        name: "Modifier",
        onRequest: async (ctx) => {
          ctx.input = "modified input";
        }
      };

      await llm.embed("input text", {
        model: "test-model",
        middlewares: [modifier]
      });

      // Verify the provider received the modified input
      expect(provider.embedCalls).toHaveLength(1);
      expect(provider.embedCalls[0].input).toBe("modified input");
    });

    it("should persist state between hooks", async () => {
      let capturedState: any;

      const stateMiddleware: Middleware = {
        name: "State",
        onRequest: async (ctx) => {
          ctx.state.startTime = 12345;
        },
        onResponse: async (ctx) => {
          capturedState = ctx.state;
        }
      };

      await llm.embed("input text", {
        model: "test-model",
        middlewares: [stateMiddleware]
      });

      expect(capturedState?.startTime).toBe(12345);
    });

    it("should execute onError when provider fails", async () => {
      const onError = vi.fn();
      const middleware: Middleware = {
        name: "ErrorMiddleware",
        onError
      };

      // Mock failure
      vi.spyOn(provider, "embed").mockRejectedValue(new Error("Embedding failed"));

      await expect(
        llm.embed("input text", {
          model: "test-model",
          middlewares: [middleware]
        })
      ).rejects.toThrow("Embedding failed");

      expect(onError).toHaveBeenCalledTimes(1);
      const [ctx, error] = onError.mock.calls[0]!;
      expect((error as Error).message).toBe("Embedding failed");
      expect(ctx.requestId).toBeDefined();
    });
  });
});
