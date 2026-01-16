import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Tool, ToolDefinition } from "../../../src/chat/Tool.js";
import { FakeProvider } from "../../fake-provider.js";
import { ChatOptions } from "../../../src/chat/ChatOptions.js";

// Helper type to inspect private options
type TestChat = { options: ChatOptions };

class ComplexTool extends Tool {
  name = "complex_tool";
  description = "A complex tool for testing";
  schema = {
    type: "object",
    properties: {
      query: { type: "string" }
    },
    required: ["query"]
  };
  async execute({ query }: { query: string }) {
    return `result: ${query}`;
  }
}

describe("Tool Normalization Regression Tests", () => {
  it("should normalize tool classes passed in constructor options", () => {
    const provider = new FakeProvider([]);
    const chat = new Chat(provider, "test-model", {
      tools: [ComplexTool]
    });

    const tools = (chat as unknown as TestChat).options.tools as ToolDefinition[];
    expect(tools).toHaveLength(1);

    // It should NOT be the class or a raw instance anymore
    // It should be the normalized ToolDefinition
    expect(tools[0]!.type).toBe("function");
    expect(tools[0]!.function.name).toBe("complex_tool");
    expect(tools[0]!.function.parameters.properties).toBeDefined();
    expect(typeof tools[0]!.handler).toBe("function");
  });

  it("should normalize tool instances passed in constructor options", () => {
    const provider = new FakeProvider([]);
    const toolInstance = new ComplexTool();
    const chat = new Chat(provider, "test-model", {
      tools: [toolInstance]
    });

    const tools = (chat as unknown as TestChat).options.tools as ToolDefinition[];
    expect(tools).toHaveLength(1);
    expect(tools[0]!.type).toBe("function");
    expect(tools[0]!.function.name).toBe("complex_tool");
    expect(typeof tools[0]!.handler).toBe("function");
  });

  it("should maintain normalization when adding more tools via withTools later", () => {
    const provider = new FakeProvider([]);
    const chat = new Chat(provider, "test-model", {
      tools: [ComplexTool]
    });

    class SecondTool extends Tool {
      name = "second_tool";
      description = "description";
      schema = { type: "object", properties: {} };
      async execute() {
        return "ok";
      }
    }

    chat.withTools([SecondTool]);

    const tools = (chat as unknown as TestChat).options.tools as ToolDefinition[];
    expect(tools).toHaveLength(2);
    expect(tools[0]!.function.name).toBe("complex_tool");
    expect(tools[1]!.function.name).toBe("second_tool");

    // Both should be normalized
    expect(tools[0]!.type).toBe("function");
    expect(tools[1]!.type).toBe("function");
  });

  it("should handle mixed raw objects and classes in constructor", () => {
    const provider = new FakeProvider([]);
    const rawTool = {
      type: "function" as const,
      function: { name: "raw_tool", parameters: {} },
      handler: async () => "raw"
    };

    const chat = new Chat(provider, "test-model", {
      tools: [rawTool, ComplexTool]
    });

    const tools = (chat as unknown as TestChat).options.tools as ToolDefinition[];
    expect(tools).toHaveLength(2);
    expect(tools[0]!.function.name).toBe("raw_tool");
    expect(tools[1]!.function.name).toBe("complex_tool");
    expect(tools[1]!.type).toBe("function");
  });

  describe("Validation", () => {
    it("should throw error if using 'execute' instead of 'handler' for raw objects", () => {
      const provider = new FakeProvider([]);
      const toolWithExecute = {
        function: { name: "execute_tool", parameters: {} },
        execute: async () => "executed"
      };

      expect(
        () =>
          new Chat(provider, "test-model", {
            tools: [toolWithExecute as unknown as ToolDefinition]
          })
      ).toThrow(/must have a 'handler' function/);
    });

    it("should throw ConfigurationError if function.name is missing", () => {
      const provider = new FakeProvider([]);
      const badTool = {
        function: { parameters: {} }, // name missing
        handler: async () => "ok"
      };

      expect(
        () =>
          new Chat(provider, "test-model", {
            tools: [badTool as unknown as ToolDefinition]
          })
      ).toThrow(/function.name/);
    });

    it("should throw ConfigurationError if handler is missing and cannot be auto-mapped", () => {
      const provider = new FakeProvider([]);
      const badTool = {
        function: { name: "no_handler", parameters: {} }
        // neither handler nor execute
      };

      expect(
        () =>
          new Chat(provider, "test-model", {
            tools: [badTool as unknown as ToolDefinition]
          })
      ).toThrow(/must have a 'handler' function/);
    });
  });
});
