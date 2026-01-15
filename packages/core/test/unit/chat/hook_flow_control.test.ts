import { describe, it, expect, vi } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { ToolError, AuthenticationError } from "../../../src/errors/index.js";

class MockToolProvider implements Provider {
  public id = "mock";
  private responses: ChatResponse[] = [];
  constructor(responses: ChatResponse[]) {
    this.responses = responses;
  }
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = this.responses.shift();
    if (!response) throw new Error("No responses");
    return response;
  }
  defaultModel() { return "test-model"; }
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
      tool_calls: [{ id: "c1", type: "function", function: { name: "standard_tool", arguments: "{}" } }]
    };

    const provider = new MockToolProvider([toolCallResponse]);
    
    // Hook forced to stop
    const onToolCallError = vi.fn().mockReturnValue("STOP");
    
    const chat = new Chat(provider, "test-model", { 
      tools: [standardTool as any],
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
      tool_calls: [{ id: "c1", type: "function", function: { name: "fatal_tool", arguments: "{}" } }]
    };

    // Final response if we continue
    const finalResponse: ChatResponse = { content: "I ignored the error" };
    
    const provider = new MockToolProvider([toolCallResponse, finalResponse]);
    
    // Hook forced to continue
    const onToolCallError = vi.fn().mockReturnValue("CONTINUE");
    
    const chat = new Chat(provider, "test-model", { 
      tools: [fatalTool as any],
      onToolCallError 
    });

    const response = await chat.ask("Call tool");
    expect(String(response)).toBe("I ignored the error");
    expect(onToolCallError).toHaveBeenCalled();
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
      tool_calls: [{ id: "c1", type: "function", function: { name: "fatal_tool", arguments: "{}" } }]
    };

    const provider = new MockToolProvider([toolCallResponse]);
    const onToolCallError = vi.fn(); // returns void
    
    const chat = new Chat(provider, "test-model", { 
      tools: [fatalTool as any],
      onToolCallError 
    });

    await expect(chat.ask("Call tool")).rejects.toThrow("Fatal");
    expect(onToolCallError).toHaveBeenCalled();
  });
});
