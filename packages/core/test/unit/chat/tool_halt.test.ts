import { describe, it, expect, vi } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Tool, ToolHalt } from "../../../src/chat/Tool.js";
import { ToolHandler } from "../../../src/chat/ToolHandler.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import { z } from "zod";

// ============================================================================
// Test Provider
// ============================================================================

class MockToolProvider implements Provider {
  private responses: ChatResponse[] = [];
  public requests: ChatRequest[] = [];

  constructor(responses: ChatResponse[]) {
    this.responses = responses;
  }

  id = "mock-provider";

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.requests.push({
      ...request,
      messages: [...request.messages]
    });
    const response = this.responses.shift();
    if (!response) {
      throw new Error("No more responses configured");
    }
    return response;
  }

  defaultModel() {
    return "test-model";
  }

  formatToolResultMessage(toolCallId: string, content: string): Message {
    return {
      role: "tool",
      tool_call_id: toolCallId,
      content: content
    };
  }
}

// ============================================================================
// Test Tools
// ============================================================================

class PaymentTool extends Tool<{ amount: number; recipient: string }> {
  name = "process_payment";
  description = "Process a payment";
  schema = z.object({
    amount: z.number(),
    recipient: z.string()
  });

  async execute({ amount, recipient }: { amount: number; recipient: string }) {
    if (amount > 10000) {
      return this.halt(`Payment of $${amount} to ${recipient} requires manager approval.`);
    }
    return { success: true, transactionId: "TXN-123", amount, recipient };
  }
}

class AlwaysHaltTool extends Tool<Record<string, never>> {
  name = "always_halt";
  description = "Always halts";
  schema = z.object({});

  async execute() {
    return this.halt("Operation halted immediately.");
  }
}

class NeverHaltTool extends Tool<{ value: string }> {
  name = "never_halt";
  description = "Never halts";
  schema = z.object({ value: z.string() });

  async execute({ value }: { value: string }) {
    return { processed: value };
  }
}

// ============================================================================
// ToolHalt Class Tests
// ============================================================================

describe("ToolHalt", () => {
  describe("ToolHalt class", () => {
    it("should store content in constructor", () => {
      const halt = new ToolHalt("Stop here");
      expect(halt.content).toBe("Stop here");
    });

    it("should convert to string via toString()", () => {
      const halt = new ToolHalt("Stop message");
      expect(halt.toString()).toBe("Stop message");
      expect(String(halt)).toBe("Stop message");
    });

    it("should serialize to JSON with halt flag", () => {
      const halt = new ToolHalt("Halted!");
      expect(halt.toJSON()).toEqual({ halt: true, content: "Halted!" });
    });
  });

  describe("Tool.halt() method", () => {
    it("should return a ToolHalt instance", async () => {
      const tool = new AlwaysHaltTool();
      const result = await tool.execute();
      expect(result).toBeInstanceOf(ToolHalt);
      expect((result as ToolHalt).content).toBe("Operation halted immediately.");
    });

    it("should return ToolHalt conditionally", async () => {
      const tool = new PaymentTool();

      // Small amount - no halt
      const smallResult = await tool.execute({ amount: 100, recipient: "John" });
      expect(smallResult).not.toBeInstanceOf(ToolHalt);
      expect(smallResult).toHaveProperty("success", true);

      // Large amount - halt
      const largeResult = await tool.execute({ amount: 15000, recipient: "Acme" });
      expect(largeResult).toBeInstanceOf(ToolHalt);
      expect((largeResult as ToolHalt).content).toContain("requires manager approval");
    });
  });

  describe("Tool.handler() with halt", () => {
    it("should preserve ToolHalt instance in handler", async () => {
      const tool = new AlwaysHaltTool();
      const result = await tool.handler({});
      expect(result).toBeInstanceOf(ToolHalt);
    });

    it("should return string for normal execution", async () => {
      const tool = new NeverHaltTool();
      const result = await tool.handler({ value: "test" });
      expect(typeof result).toBe("string");
      expect(result).toContain("processed");
    });
  });
});

// ============================================================================
// ToolHandler Tests
// ============================================================================

describe("ToolHandler with ToolHalt", () => {
  it("should detect halt and set halted flag to true", async () => {
    const tool = new AlwaysHaltTool();
    const toolDef = tool.toLLMTool();

    const result = await ToolHandler.execute(
      {
        id: "call_1",
        type: "function",
        function: { name: "always_halt", arguments: "{}" }
      },
      [toolDef]
    );

    expect(result.halted).toBe(true);
    expect(result.content).toBe("Operation halted immediately.");
    expect(result.tool_call_id).toBe("call_1");
  });

  it("should set halted flag to false for normal execution", async () => {
    const tool = new NeverHaltTool();
    const toolDef = tool.toLLMTool();

    const result = await ToolHandler.execute(
      {
        id: "call_2",
        type: "function",
        function: { name: "never_halt", arguments: '{"value":"hello"}' }
      },
      [toolDef]
    );

    expect(result.halted).toBe(false);
    expect(result.content).toContain("processed");
  });

  it("should handle conditional halt correctly", async () => {
    const tool = new PaymentTool();
    const toolDef = tool.toLLMTool();

    // Small payment - no halt
    const smallResult = await ToolHandler.execute(
      {
        id: "call_small",
        type: "function",
        function: { name: "process_payment", arguments: '{"amount":500,"recipient":"Bob"}' }
      },
      [toolDef]
    );
    expect(smallResult.halted).toBe(false);
    expect(smallResult.content).toContain("success");

    // Large payment - halt
    const largeResult = await ToolHandler.execute(
      {
        id: "call_large",
        type: "function",
        function: { name: "process_payment", arguments: '{"amount":50000,"recipient":"Corp"}' }
      },
      [toolDef]
    );
    expect(largeResult.halted).toBe(true);
    expect(largeResult.content).toContain("requires manager approval");
  });
});

// ============================================================================
// Chat Integration Tests
// ============================================================================

describe("Chat with ToolHalt", () => {
  it("should stop the agentic loop when tool returns halt", async () => {
    const tool = new PaymentTool();

    // Response 1: LLM requests the tool with large amount
    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        {
          id: "call_halt",
          type: "function",
          function: {
            name: "process_payment",
            arguments: '{"amount":25000,"recipient":"BigCorp"}'
          }
        }
      ]
    };

    // Response 2: Would be the final response, but halt should prevent this
    const finalResponse: ChatResponse = {
      content: "This should NOT be reached due to halt"
    };

    const provider = new MockToolProvider([toolCallResponse, finalResponse]);
    const chat = new Chat(provider, "test-model");

    const response = await chat.withTool(tool).ask("Pay $25000 to BigCorp");

    // Should have halt message as the response
    expect(String(response)).toContain("requires manager approval");

    // Should only have made ONE request to provider (halt stops the loop)
    expect(provider.requests).toHaveLength(1);
  });

  it("should continue the loop when tool does not halt", async () => {
    const tool = new PaymentTool();

    // Response 1: LLM requests the tool with small amount
    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        {
          id: "call_ok",
          type: "function",
          function: {
            name: "process_payment",
            arguments: '{"amount":100,"recipient":"John"}'
          }
        }
      ]
    };

    // Response 2: Final response after tool execution
    const finalResponse: ChatResponse = {
      content: "Payment of $100 to John was successful!"
    };

    const provider = new MockToolProvider([toolCallResponse, finalResponse]);
    const chat = new Chat(provider, "test-model");

    const response = await chat.withTool(tool).ask("Pay $100 to John");

    // Should have the final LLM response
    expect(String(response)).toBe("Payment of $100 to John was successful!");

    // Should have made TWO requests (tool execution + final response)
    expect(provider.requests).toHaveLength(2);
  });

  it("should call onEndMessage with halt response", async () => {
    const tool = new AlwaysHaltTool();
    const onEndMessage = vi.fn();

    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        {
          id: "call_halt",
          type: "function",
          function: { name: "always_halt", arguments: "{}" }
        }
      ]
    };

    const provider = new MockToolProvider([toolCallResponse]);
    const chat = new Chat(provider, "test-model");

    await chat.withTool(tool).onEndMessage(onEndMessage).ask("Do something");

    expect(onEndMessage).toHaveBeenCalledTimes(1);
    const callArg = onEndMessage.mock.calls[0][0];
    expect(String(callArg)).toBe("Operation halted immediately.");
  });

  it("should handle halt after multiple tool calls in same turn", async () => {
    const normalTool = new NeverHaltTool();
    const haltTool = new AlwaysHaltTool();

    // LLM requests two tools - second one halts
    const toolCallResponse: ChatResponse = {
      content: null,
      tool_calls: [
        {
          id: "call_1",
          type: "function",
          function: { name: "never_halt", arguments: '{"value":"first"}' }
        },
        {
          id: "call_2",
          type: "function",
          function: { name: "always_halt", arguments: "{}" }
        }
      ]
    };

    const provider = new MockToolProvider([toolCallResponse]);
    const chat = new Chat(provider, "test-model");

    const response = await chat.withTools([normalTool, haltTool]).ask("Run both tools");

    // Halt message should be the response
    expect(String(response)).toBe("Operation halted immediately.");

    // Only one provider request (halt stops the loop)
    expect(provider.requests).toHaveLength(1);
  });
});
