import { describe, it, expect, vi } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import { ToolDefinition } from "../../../src/chat/Tool.js";
import { ToolError, AuthenticationError } from "../../../src/errors/index.js";

class MockToolProvider implements Provider {
  public id = "mock";
  private responses: ChatResponse[] = [];
  constructor(responses: ChatResponse[]) {
    this.responses = responses;
  }
  async chat(_request: ChatRequest): Promise<ChatResponse> {
    const response = this.responses.shift();
    if (!response) throw new Error("No responses");
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

describe("Hook Flow Control", () => {
  it("should STOP execution when hook returns 'STOP'", async () => {
    const standardTool = {
      function: { name: "standard_tool", parameters: {} },
      handler: async () => {
        throw new Error("Standard error");
      }
    };

    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        { id: "c1", type: "function", function: { name: "standard_tool", arguments: "{}" } }
      ]
    };

    const provider = new MockToolProvider([toolCallResponse]);

    // Hook forced to stop
    const onToolCallError = vi.fn().mockReturnValue("STOP");

    const chat = new Chat(provider, "test-model", {
      tools: [standardTool as unknown as ToolDefinition],
      onToolCallError
    });

    await expect(chat.ask("Call tool")).rejects.toThrow("Standard error");
    expect(onToolCallError).toHaveBeenCalled();
  });

  it("should CONTINUE execution when hook returns 'CONTINUE' even for fatal errors", async () => {
    const fatalTool = {
      function: { name: "fatal_tool", parameters: {} },
      handler: async () => {
        throw new AuthenticationError("Unauthorized", 401, {});
      }
    };

    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        { id: "c1", type: "function", function: { name: "fatal_tool", arguments: "{}" } }
      ]
    };

    // Final response if we continue
    const finalResponse: ChatResponse = { content: "Result after ignore" };

    const provider = new MockToolProvider([toolCallResponse, finalResponse]);

    // Hook forced to continue
    const onToolCallError = vi.fn().mockReturnValue("CONTINUE");

    const chat = new Chat(provider, "test-model", {
      tools: [fatalTool as unknown as ToolDefinition],
      onToolCallError
    });

    const result = await chat.ask("Call fatal tool");
    expect(result.content).toBe("Result after ignore");
    expect(onToolCallError).toHaveBeenCalled();
  });

  it("should ALLOW RETRY when hook returns 'RETRY'", async () => {
    // We simulate a first failure and then success
    let attempts = 0;
    const fatalTool = {
      function: { name: "fatal_tool", parameters: {} },
      handler: async () => {
        attempts++;
        if (attempts === 1) {
          throw new AuthenticationError("Unauthorized", 401, {});
        }
        return "Success!";
      }
    };

    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        { id: "c1", type: "function", function: { name: "fatal_tool", arguments: "{}" } }
      ]
    };

    const finalResponse: ChatResponse = {
      content: "Success!"
    };

    // The provider needs to provide a response for the initial tool call,
    // and then a final response after tool execution.
    const provider = new MockToolProvider([toolCallResponse, finalResponse]);

    const onToolCallError = vi.fn().mockImplementation(() => {
      // Only retry once
      return attempts === 1 ? "RETRY" : "STOP";
    });

    const chat = new Chat(provider, "test-model", {
      tools: [fatalTool as unknown as ToolDefinition],
      onToolCallError
    });

    // The chat should eventually succeed because the tool retries and then returns "Success!"
    const result = await chat.ask("Call tool");
    expect(result.content).toBe("Success!"); // Expecting the tool's successful output
    expect(onToolCallError).toHaveBeenCalledTimes(1); // Hook called once for the error
    expect(attempts).toBe(2); // Tool handler called twice (initial failure + retry success)
  });

  it("should follow default logic when hook returns void", async () => {
    const fatalTool = {
      function: { name: "fatal_tool", parameters: {} },
      handler: async () => {
        throw new ToolError("Fatal", "fatal_tool", true);
      }
    };

    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        { id: "c1", type: "function", function: { name: "fatal_tool", arguments: "{}" } }
      ]
    };

    const provider = new MockToolProvider([toolCallResponse]);
    const onToolCallError = vi.fn(); // returns void

    const chat = new Chat(provider, "test-model", {
      tools: [fatalTool as unknown as ToolDefinition],
      onToolCallError
    });

    await expect(chat.ask("Call tool")).rejects.toThrow("Fatal");
    expect(onToolCallError).toHaveBeenCalled();
  });
});
