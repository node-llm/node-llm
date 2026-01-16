import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Tool, ToolDefinition } from "../../../src/chat/Tool.js";
import { createLLM } from "../../../src/llm.js";
import { FakeProvider } from "../../fake-provider.js";

class TestTool extends Tool {
  name = "test_tool";
  description = "A test tool";
  schema = z.object({
    input: z.string()
  });

  async execute({ input }: { input: string }) {
    return `Output: ${input}`;
  }
}

describe("Tool DSL", () => {
  it("should convert to a standard LLM tool format", () => {
    const tool = new TestTool();
    const llmTool = tool.toLLMTool();

    expect(llmTool.type).toBe("function");
    expect(llmTool.function.name).toBe("test_tool");
    expect(llmTool.function.description).toBe("A test tool");
    expect(llmTool.function.parameters.type).toBe("object");
    expect(llmTool.function.parameters.properties.input).toBeDefined();
    expect(typeof llmTool.handler).toBe("function");
  });

  it("should execute the logic via the handler", async () => {
    const tool = new TestTool();
    const llmTool = tool.toLLMTool();

    // @ts-expect-error
    const result = await llmTool.handler({ input: "hello" });
    expect(result).toBe("Output: hello");
  });

  it("should be correctly registered in a Chat session", async () => {
    const provider = new FakeProvider();
    const llm = createLLM({ provider });

    const chat = llm.chat("fake-model");
    chat.withTools([TestTool]);

    // Check if the tool was normalized
    const registeredTool = ((chat as unknown) as { options: { tools: ToolDefinition[] } }).options.tools[0];
    expect(registeredTool?.function.name).toBe("test_tool");
    expect(typeof registeredTool?.handler).toBe("function");
  });

  it("should handle object responses by stringifying them", async () => {
    class ObjectTool extends Tool {
      name = "object_tool";
      description = "Returns an object";
      schema = z.object({});
      async execute() {
        return { success: true };
      }
    }

    const tool = new ObjectTool();
    const llmTool = tool.toLLMTool();
    // @ts-expect-error
    const result = await llmTool.handler({});
    expect(result).toBe('{"success":true}');
  });
});
