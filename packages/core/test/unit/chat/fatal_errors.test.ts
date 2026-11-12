import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import { ToolError, AuthenticationError } from "../../../src/errors/index.js";
import { ToolDefinition, Tool, defineTool } from "../../../src/chat/Tool.js";
import { z } from "zod";

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

describe("Fatal Tool Error Short-Circuiting", () => {
  it("should short-circuit the loop on fatal ToolError", async () => {
    const fatalTool = {
      function: { name: "fatal_tool", parameters: {} },
      handler: async () => {
        throw new ToolError("API Key Expired", "fatal_tool", true);
      }
    };

    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        { id: "c1", type: "function", function: { name: "fatal_tool", arguments: "{}" } }
      ]
    };

    const finalResponse: ChatResponse = { content: "Should not reach this" };
    const provider = new MockToolProvider([toolCallResponse, finalResponse]);
    const chat = new Chat(provider, "test-model", {
      tools: [fatalTool as unknown as ToolDefinition]
    });

    // Expect the call to THROW instead of continuing to finalResponse
    await expect(chat.ask("Call fatal tool")).rejects.toThrow("API Key Expired");
  });

  it("should short-circuit the loop on AuthenticationError (401)", async () => {
    const authTool = {
      function: { name: "auth_tool", parameters: {} },
      handler: async () => {
        throw new AuthenticationError("Unauthorized", 401, {});
      }
    };

    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [{ id: "c1", type: "function", function: { name: "auth_tool", arguments: "{}" } }]
    };

    const provider = new MockToolProvider([toolCallResponse]);
    const chat = new Chat(provider, "test-model", {
      tools: [authTool as unknown as ToolDefinition]
    });

    await expect(chat.ask("Call auth tool")).rejects.toThrow("Unauthorized");
  });

  it("should NOT short-circuit on standard errors", async () => {
    const standardTool = {
      function: { name: "standard_tool", parameters: {} },
      handler: async () => {
        throw new Error("Temporary timeout");
      }
    };

    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        { id: "c1", type: "function", function: { name: "standard_tool", arguments: "{}" } }
      ]
    };

    const finalResponse: ChatResponse = { content: "Handled error" };
    const provider = new MockToolProvider([toolCallResponse, finalResponse]);
    const chat = new Chat(provider, "test-model", {
      tools: [standardTool as unknown as ToolDefinition]
    });

    const response = await chat.ask("Call standard tool");

    // Should continue to final response
    expect(String(response)).toBe("Handled error");
  });

  describe("tools built with the Tool class", () => {
    const callTool = (name: string): ChatResponse => ({
      content: null,
      tool_calls: [{ id: "c1", type: "function", function: { name, arguments: "{}" } }]
    });

    it("stops the loop on a fatal ToolError thrown from a Tool subclass", async () => {
      class ExpiredKeyTool extends Tool<Record<string, never>> {
        name = "expired_key";
        description = "Always fails fatally";
        schema = z.object({});
        async execute(): Promise<unknown> {
          throw new ToolError("API Key Expired", "expired_key", true);
        }
      }
      const provider = new MockToolProvider([
        callTool("expired_key"),
        { content: "Should not reach this" }
      ]);
      const chat = new Chat(provider, "test-model").withTool(ExpiredKeyTool);

      await expect(chat.ask("Call it")).rejects.toThrow("API Key Expired");
    });

    it("stops the loop on a 401 thrown from a defineTool tool", async () => {
      const AuthTool = defineTool({
        name: "auth_tool",
        description: "Fails with a 401",
        schema: z.object({}),
        execute: async () => {
          throw new AuthenticationError("Unauthorized", 401, {});
        }
      });
      const provider = new MockToolProvider([
        callTool("auth_tool"),
        { content: "Should not reach this" }
      ]);
      const chat = new Chat(provider, "test-model").withTool(AuthTool);

      await expect(chat.ask("Call it")).rejects.toThrow("Unauthorized");
    });

    it("still shows a non-fatal error to the model, which carries on", async () => {
      const FlakyTool = defineTool({
        name: "flaky",
        description: "Fails, not fatally",
        schema: z.object({}),
        execute: async () => {
          throw new ToolError("Try again", "flaky", false);
        }
      });
      const provider = new MockToolProvider([callTool("flaky"), { content: "Recovered" }]);
      const chat = new Chat(provider, "test-model").withTool(FlakyTool);

      const response = await chat.ask("Call it");
      expect(String(response)).toBe("Recovered");
      expect(JSON.stringify(chat.history)).toContain("Error executing tool 'flaky': Try again");
    });

    it("rethrows a fatal error from the handler, where it used to become text", async () => {
      const tool = new (defineTool({
        name: "fatal",
        description: "Fails fatally",
        schema: z.object({}),
        execute: async () => {
          throw new ToolError("Stop", "fatal", true);
        }
      }))();

      await expect(tool.handler({})).rejects.toThrow("Stop");
    });
  });
});
