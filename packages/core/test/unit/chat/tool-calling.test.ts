import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";

class MockToolProvider implements Provider {
  // Sequence of responses to return
  private responses: ChatResponse[] = [];
  public requests: ChatRequest[] = [];

  constructor(responses: ChatResponse[]) {
    this.responses = responses;
  }

  id = "mock-provider";

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Clone messages to capture state at this point in time
    this.requests.push({
      ...request,
      messages: [...request.messages]
    });
    const response = this.responses.shift();
    if (!response) {
      throw new Error("No more responses configured in MockToolProvider");
    }
    return response;
  }

  defaultModel() {
    return "test-model";
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

describe("Chat Tool Calling", () => {
  it("should execute a tool and return the final response", async () => {
    const weatherTool = {
      type: "function" as const,
      function: {
        name: "get_weather",
        description: "Get weather",
        parameters: { type: "object", properties: {} }
      },
      handler: async (_args: unknown) => {
        return JSON.stringify({ temperature: 25, condition: "Sunny" });
      }
    };

    // 1. First response: Request the tool
    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        {
          id: "call_123",
          type: "function",
          function: {
            name: "get_weather",
            arguments: "{}"
          }
        }
      ]
    };

    // 2. Second response: Final answer after tool execution
    const finalResponse: ChatResponse = {
      content: "The weather is Sunny with 25 degrees."
    };

    const provider = new MockToolProvider([toolCallResponse, finalResponse]);

    const chat = new Chat(provider, "test-model");

    const response = await chat.withTool(weatherTool).ask("What is the weather?");

    // Assertions
    expect(String(response)).toBe("The weather is Sunny with 25 degrees.");

    // Verify provider received 2 requests
    expect(provider.requests).toHaveLength(2);

    // First request: User prompt
    expect(provider.requests[0]!.messages).toHaveLength(1);
    expect(provider.requests[0]!.messages[0]!.role).toBe("user");

    // Second request: History should include:
    // 1. User prompt
    // 2. Assistant tool call
    // 3. Tool result
    const history = provider.requests[1]!.messages;
    expect(history).toHaveLength(3);
    expect(history[0]!.role).toBe("user");
    expect(history[1]!.role).toBe("assistant");
    expect(history[1]!.tool_calls).toBeDefined();
    expect(history[2]!.role).toBe("tool");
    expect(history[2]!.content).toContain("Sunny");
  });

  it("should handle tool execution errors gracefully", async () => {
    const errorTool = {
      type: "function" as const,
      function: {
        name: "fail_tool",
        parameters: {}
      },
      handler: async () => {
        throw new Error("Something went wrong");
      }
    };

    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        {
          id: "call_fail",
          type: "function",
          function: {
            name: "fail_tool",
            arguments: "{}"
          }
        }
      ]
    };

    const finalResponse: ChatResponse = {
      content: "I could not get the info."
    };

    const provider = new MockToolProvider([toolCallResponse, finalResponse]);
    const chat = new Chat(provider, "test-model");

    await chat.withTool(errorTool).ask("Trigger error");
    const history = provider.requests[1]!.messages;
    const toolMessage = history.find((m) => m.role === "tool");
    expect(toolMessage?.content).toContain(
      "Fatal error executing tool 'fail_tool': Something went wrong"
    );
  });

  it("should support both constructor tools and withTool fluent API", async () => {
    const tool1 = {
      type: "function" as const,
      function: { name: "tool1", parameters: {} },
      handler: async () => "result1"
    };
    const tool2 = {
      type: "function" as const,
      function: { name: "tool2", parameters: {} },
      handler: async () => "result2"
    };

    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [{ id: "c1", type: "function", function: { name: "tool2", arguments: "{}" } }]
    };
    const finalResponse: ChatResponse = { content: "Done" };

    const provider = new MockToolProvider([toolCallResponse, finalResponse]);

    // tool1 via constructor, tool2 via withTool
    const chat = new Chat(provider, "test-model", { tools: [tool1] });
    await chat.withTool(tool2).ask("Call tool2");

    expect(provider.requests[0]!.tools).toContain(tool1);
    expect(provider.requests[0]!.tools).toContain(tool2);
  });
});
