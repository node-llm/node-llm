import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse, ChatChunk } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import { ToolCallLimitError } from "../../../src/errors/index.js";

class MockLoopProvider implements Provider {
  public id = "mock-loop";
  public requests: ChatRequest[] = [];

  defaultModel(_feature?: string): string {
    return "test-model";
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.requests.push(request);
    return this.reply();
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatChunk> {
    this.requests.push(request);
    const { tool_calls, usage } = this.reply();
    yield { content: "", tool_calls, usage };
  }

  // Always return a tool call to simulate an infinite loop
  private reply(): ChatResponse {
    return {
      content: null,
      usage: { input_tokens: 10, output_tokens: 2, total_tokens: 12 },
      tool_calls: [
        {
          id: `call_${this.requests.length}`,
          type: "function",
          function: {
            name: "ping",
            arguments: "{}"
          }
        }
      ]
    };
  }

  formatToolResultMessage(
    toolCallId: string,
    content: string,
    options?: { isError?: boolean }
  ): Message {
    return {
      role: "tool",
      tool_call_id: toolCallId,
      content: content,
      isError: options?.isError
    };
  }
}

describe("Chat Loop Guard", () => {
  it("should throw an error when maxToolCalls is exceeded", async () => {
    const provider = new MockLoopProvider();
    const chat = new Chat(provider, "test-model");

    // Define a dummy tool
    const pingTool = {
      type: "function" as const,
      function: { name: "ping", parameters: {} },
      handler: async () => "pong"
    };

    // Test with maxToolCalls: 2
    // Turn 1: Assistant calls tool (step 1)
    // Turn 2: Assistant calls tool again (step 2)
    // Turn 3: Should throw
    await expect(chat.withTool(pingTool).ask("Trigger loop", { maxToolCalls: 2 })).rejects.toThrow(
      "[NodeLLM] Maximum tool execution calls (2) exceeded."
    );

    // Verify it actually ran 3 times (initial + 2 loops)
    expect(provider.requests).toHaveLength(3);
  });

  it("should respect the default limit of 5 tool calls", async () => {
    const provider = new MockLoopProvider();
    const chat = new Chat(provider, "test-model");

    const pingTool = {
      type: "function" as const,
      function: { name: "ping", parameters: {} },
      handler: async () => "pong"
    };

    await expect(chat.withTool(pingTool).ask("Trigger loop")).rejects.toThrow(
      "[NodeLLM] Maximum tool execution calls (5) exceeded."
    );

    expect(provider.requests).toHaveLength(6); // 1 initial + 5 steps
  });

  describe("when the limit is reached", () => {
    const pingTool = {
      type: "function" as const,
      function: { name: "ping", parameters: {} },
      handler: async () => "pong"
    };

    it("throws a ToolCallLimitError with the limit and the usage so far", async () => {
      const chat = new Chat(new MockLoopProvider(), "test-model").withTool(pingTool);

      const error = await chat.ask("Trigger loop", { maxToolCalls: 2 }).catch((e) => e);

      expect(error).toBeInstanceOf(ToolCallLimitError);
      expect(error.code).toBe("TOOL_CALL_LIMIT");
      expect(error.limit).toBe(2);
      expect(error.usage.total_tokens).toBe(36); // 3 requests
      expect(chat.totalUsage.total_tokens).toBe(36);
    });

    it("answers the calls it did not run, so the chat can be asked again", async () => {
      const provider = new MockLoopProvider();
      const chat = new Chat(provider, "test-model").withTool(pingTool);
      await chat.ask("Trigger loop", { maxToolCalls: 1 }).catch(() => {});

      expect(chat.history.at(-1)).toMatchObject({
        role: "tool",
        tool_call_id: "call_2",
        content: expect.stringContaining("tool call limit (1)")
      });

      await chat.ask("Carry on", { maxToolCalls: 1 }).catch(() => {});
      const resumed = provider.requests[2]?.messages ?? [];
      const assistantIndex = resumed.findIndex((m) => m.tool_calls?.[0]?.id === "call_2");
      expect(resumed[assistantIndex + 1]).toMatchObject({ role: "tool", tool_call_id: "call_2" });
    });

    it("allows the same tool rounds when streaming as when asking", async () => {
      const provider = new MockLoopProvider();
      const chat = new Chat(provider, "test-model").withTool(pingTool);

      const error = await (async () => {
        for await (const _chunk of chat.stream("Trigger loop", { maxToolCalls: 2 })) {
          // drain
        }
      })().catch((e) => e);

      expect(error).toBeInstanceOf(ToolCallLimitError);
      expect(error.usage.total_tokens).toBe(36);
      expect(provider.requests).toHaveLength(3); // initial + 2 rounds, as with ask()
      expect(chat.history.at(-1)?.role).toBe("tool");
    });
  });
});
