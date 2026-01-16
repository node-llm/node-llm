import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";

class MockLoopProvider implements Provider {
  public id = "mock-loop";
  public requests: ChatRequest[] = [];

  defaultModel(_feature?: string): string {
    return "test-model";
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.requests.push(request);

    // Always return a tool call to simulate an infinite loop
    return {
      content: null,
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

  formatToolResultMessage(toolCallId: string, content: string, options?: { isError?: boolean }): Message {
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
});
