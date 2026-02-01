import { describe, it, expect, vi, beforeEach } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";
import { Middleware, MiddlewareContext } from "../../../src/types/Middleware.js";
import { ChatResponseString } from "../../../src/chat/ChatResponse.js";
import { ChatResponse, ChatRequest } from "../../../src/providers/Provider.js";
import { ToolResolvable } from "../../../src/chat/Tool.js";

// Extended FakeProvider to support test helpers
class TestProvider extends FakeProvider {
  public calls: any[] = [];

  constructor() {
    super([]);
  }

  // Helper to add responses dynamically
  addResponse(response: string | ChatResponse | Error) {
    (this as any).replies.push(response);
  }

  addError(error: Error) {
    this.addResponse(error);
  }

  async chat(request: any): Promise<ChatResponse> {
    this.calls.push(request);
    return super.chat(request);
  }

  // Ensure stream pushes to calls so we can verify inspection
  async *stream(request: ChatRequest) {
    this.calls.push(request);
    yield* super.stream(request);
  }
}

describe("Chat Middleware (Streaming)", () => {
  let provider: TestProvider;
  let chat: Chat;

  const consumeStream = async (stream: AsyncIterable<any>) => {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return chunks;
  };

  beforeEach(() => {
    provider = new TestProvider();
    // Default mock response
    provider.addResponse("Assistant response");
  });

  describe("Lifecycle Hooks", () => {
    it("should execute onRequest before the provider call", async () => {
      const onRequest = vi.fn();
      const middleware: Middleware = {
        name: "TestMiddleware",
        onRequest
      };

      chat = new Chat(provider, "test-model", { middlewares: [middleware] });
      await consumeStream(chat.stream("Hello"));

      expect(onRequest).toHaveBeenCalledTimes(1);
      const reqCtx = onRequest.mock.calls[0]![0] as MiddlewareContext;

      expect(reqCtx.provider).toBe("fake");
      expect(reqCtx.model).toBe("test-model");
      expect(reqCtx.messages).toHaveLength(1);
      expect(reqCtx.messages![0].content).toBe("Hello");
      expect(reqCtx.requestId).toBeDefined();
    });

    it("should execute onResponse after the provider call completion", async () => {
      const onResponse = vi.fn();
      const middleware: Middleware = {
        name: "TestMiddleware",
        onResponse
      };

      chat = new Chat(provider, "test-model", { middlewares: [middleware] });
      await consumeStream(chat.stream("Hello"));

      expect(onResponse).toHaveBeenCalledTimes(1);
      const resCtx = onResponse.mock.calls[0]![0] as MiddlewareContext;
      const result = onResponse.mock.calls[0]![1] as ChatResponseString;

      expect(resCtx.requestId).toBeDefined();
      // FakeProvider streams word by word: "Assistant" "response"
      expect(result.toString()).toContain("Assistant response");
    });

    it("should execute multiple middlewares in order", async () => {
      const callOrder: string[] = [];

      const m1: Middleware = {
        name: "M1",
        onRequest: async () => {
          callOrder.push("M1:request");
        },
        onResponse: async () => {
          callOrder.push("M1:response");
        }
      };

      const m2: Middleware = {
        name: "M2",
        onRequest: async () => {
          callOrder.push("M2:request");
        },
        onResponse: async () => {
          callOrder.push("M2:response");
        }
      };

      chat = new Chat(provider, "test-model", { middlewares: [m1, m2] });
      await consumeStream(chat.stream("Hello"));

      expect(callOrder).toEqual(["M1:request", "M2:request", "M1:response", "M2:response"]);
    });

    it("should allow modifying messages in onRequest", async () => {
      const modifier: Middleware = {
        name: "Modifier",
        onRequest: async (ctx) => {
          if (ctx.messages?.[0]) {
            ctx.messages[0].content = "Modified Hello";
          }
        }
      };

      chat = new Chat(provider, "test-model", { middlewares: [modifier] });
      await consumeStream(chat.stream("Hello"));

      // Verify the provider received the modified message
      const lastCall = provider.calls[0];
      expect(lastCall.messages[0].content).toBe("Modified Hello");
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

      chat = new Chat(provider, "test-model", { middlewares: [stateMiddleware] });
      await consumeStream(chat.stream("Hello"));

      expect(capturedState?.startTime).toBe(12345);
    });

    it("should execute onError when provider fails", async () => {
      const onError = vi.fn();
      const middleware: Middleware = {
        name: "ErrorMiddleware",
        onError
      };

      // Force provider error. Note: creating a new instance resets responses, so we need to add the error first.
      provider = new TestProvider();
      provider.addError(new Error("Provider failed"));

      chat = new Chat(provider, "test-model", { middlewares: [middleware] });

      await expect(consumeStream(chat.stream("Hello"))).rejects.toThrow("Provider failed");

      expect(onError).toHaveBeenCalledTimes(1);
      const [ctx, error] = onError.mock.calls[0]!;
      expect((error as Error).message).toBe("Provider failed");
      expect(ctx.requestId).toBeDefined();
    });
  });

  describe("Tool Hooks", () => {
    it("should executed hooks for tool calls in stream", async () => {
      const onToolStart = vi.fn();
      const onToolEnd = vi.fn();

      const middleware: Middleware = {
        name: "ToolMiddleware",
        onToolCallStart: onToolStart,
        onToolCallEnd: onToolEnd
      };

      // Setup tool
      const tool: ToolResolvable = {
        type: "function",
        function: { name: "test_tool", parameters: {} },
        handler: async () => "tool result"
      };

      // Add tool response sequence
      // Note: we need to reset provider to clear the default "Assistant response"
      provider = new TestProvider();
      provider.addResponse({
        content: null, // content is null for tool calls usually
        tool_calls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "test_tool", arguments: "{}" }
          }
        ]
      });
      // Final response after tool
      provider.addResponse("Final answer");

      chat = new Chat(provider, "test-model", {
        middlewares: [middleware],
        tools: [tool]
      });

      await consumeStream(chat.stream("Use tool"));

      expect(onToolStart).toHaveBeenCalledTimes(1);
      expect(onToolEnd).toHaveBeenCalledTimes(1);

      const startCtx = onToolStart.mock.calls[0]![0];
      const startTool = onToolStart.mock.calls[0]![1];

      expect(startCtx.requestId).toBeDefined();
      expect(startTool.function.name).toBe("test_tool");

      const endCtx = onToolEnd.mock.calls[0]![0];
      const result = onToolEnd.mock.calls[0]![2];

      expect(endCtx.requestId).toBe(startCtx.requestId); // Same request ID
      expect(result).toBe("tool result");
    });

    it("should block tool execution if onToolCallStart throws", async () => {
      const blocker: Middleware = {
        name: "Blocker",
        onToolCallStart: async () => {
          throw new Error("Blocked!");
        }
      };

      const toolHandler = vi.fn();
      const tool: ToolResolvable = {
        type: "function",
        function: { name: "risky_tool", parameters: {} },
        handler: toolHandler
      };

      provider = new TestProvider();
      provider.addResponse({
        content: null,
        tool_calls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "risky_tool", arguments: "{}" }
          }
        ]
      });

      chat = new Chat(provider, "test-model", {
        middlewares: [blocker],
        tools: [tool]
      });

      await expect(consumeStream(chat.stream("Run risky tool"))).rejects.toThrow("Blocked!");
      expect(toolHandler).not.toHaveBeenCalled();
    });
  });
});
