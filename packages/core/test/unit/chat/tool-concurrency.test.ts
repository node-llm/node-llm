import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import { ToolExecutionMode } from "../../../src/constants.js";

class MockToolProvider implements Provider {
  private responses: ChatResponse[] = [];
  public requests: ChatRequest[] = [];

  constructor(responses: ChatResponse[]) {
    this.responses = responses;
  }

  id = "mock-provider";

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.requests.push({ ...request, messages: [...request.messages] });
    const response = this.responses.shift();
    if (!response) {
      throw new Error("No more responses configured in MockToolProvider");
    }
    return response;
  }

  defaultModel() {
    return "test-model";
  }

  formatToolResultMessage(
    toolCallId: string,
    content: string,
    options?: { isError?: boolean }
  ): Message {
    return { role: "tool", tool_call_id: toolCallId, content, isError: options?.isError };
  }
}

function makeTrackingTool(
  name: string,
  delayMs: number,
  activeCounter: { current: number; max: number }
) {
  return {
    type: "function" as const,
    function: { name, parameters: {} },
    handler: async () => {
      activeCounter.current++;
      activeCounter.max = Math.max(activeCounter.max, activeCounter.current);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      activeCounter.current--;
      return `${name}-result`;
    }
  };
}

const twoToolCallResponse: ChatResponse = {
  content: null,
  tool_calls: [
    { id: "call_1", type: "function", function: { name: "tool_a", arguments: "{}" } },
    { id: "call_2", type: "function", function: { name: "tool_b", arguments: "{}" } }
  ]
};

describe("Chat tool concurrency", () => {
  it("runs independent tool calls sequentially by default", async () => {
    const activeCounter = { current: 0, max: 0 };
    const provider = new MockToolProvider([twoToolCallResponse, { content: "done" }]);
    const chat = new Chat(provider, "test-model");

    await chat
      .withTools([
        makeTrackingTool("tool_a", 20, activeCounter),
        makeTrackingTool("tool_b", 20, activeCounter)
      ])
      .ask("Go");

    expect(activeCounter.max).toBe(1);
  });

  it("runs independent tool calls concurrently when toolConcurrency is enabled", async () => {
    const activeCounter = { current: 0, max: 0 };
    const provider = new MockToolProvider([twoToolCallResponse, { content: "done" }]);
    const chat = new Chat(provider, "test-model");

    await chat
      .withToolConcurrency(true)
      .withTools([
        // tool_a is slower so it resolves after tool_b when run concurrently,
        // exercising that result messages still land in original call order.
        makeTrackingTool("tool_a", 30, activeCounter),
        makeTrackingTool("tool_b", 5, activeCounter)
      ])
      .ask("Go");

    expect(activeCounter.max).toBe(2);

    const history = provider.requests[1]!.messages;
    const toolMessages = history.filter((m) => m.role === "tool");
    expect(toolMessages).toHaveLength(2);
    expect(toolMessages[0]!.tool_call_id).toBe("call_1");
    expect(toolMessages[0]!.content).toContain("tool_a-result");
    expect(toolMessages[1]!.tool_call_id).toBe("call_2");
    expect(toolMessages[1]!.content).toContain("tool_b-result");
  });

  it("stays sequential in confirm mode even when toolConcurrency is enabled", async () => {
    const activeCounter = { current: 0, max: 0 };
    const provider = new MockToolProvider([twoToolCallResponse, { content: "done" }]);
    const chat = new Chat(provider, "test-model");

    const confirmedCalls: string[] = [];

    await chat
      .withToolConcurrency(true)
      .withToolExecution(ToolExecutionMode.CONFIRM)
      .onConfirmToolCall((toolCall) => {
        confirmedCalls.push((toolCall as { function: { name: string } }).function.name);
        return true;
      })
      .withTools([
        makeTrackingTool("tool_a", 20, activeCounter),
        makeTrackingTool("tool_b", 20, activeCounter)
      ])
      .ask("Go");

    expect(activeCounter.max).toBe(1);
    expect(confirmedCalls).toEqual(["tool_a", "tool_b"]);
  });
});
