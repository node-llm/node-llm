import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { ToolHandler } from "../../../src/chat/ToolHandler.js";
import { Tool } from "../../../src/chat/Tool.js";

class TestTool extends Tool {
  name = "test_tool";
  description = "A test tool";
  schema = z.object({ arg: z.string() });
  async execute({ arg }: { arg: string }) {
    if (arg === "error") throw new Error("execution failed");
    return `result: ${arg}`;
  }
}

describe("ToolHandler Recovery", () => {
  it("should return an error message to the LLM when tool is missing", async () => {
    const toolCall = {
      id: "call_123",
      type: "function" as const,
      function: { name: "non_existent", arguments: "{}" }
    };

    const result = await ToolHandler.execute(toolCall, [new TestTool().toLLMTool()]);

    expect(result.tool_call_id).toBe("call_123");
    expect(result.content).toContain("unavailable tool");
    expect(result.content).toContain("test_tool"); // Should list available tools
  });

  it("should catch validation errors and return them as strings", async () => {
    const toolCall = {
      id: "call_456",
      type: "function" as const,
      function: { name: "test_tool", arguments: '{"arg": 123}' } // Wrong type
    };

    const result = await ToolHandler.execute(toolCall, [new TestTool().toLLMTool()]);

    expect(result.content).toContain("Invalid tool arguments");
    expect(result.content).toContain("Expected string, received number");
  });

  it("should catch execution errors and return them as strings", async () => {
    const toolCall = {
      id: "call_789",
      type: "function" as const,
      function: { name: "test_tool", arguments: '{"arg": "error"}' }
    };

    const result = await ToolHandler.execute(toolCall, [new TestTool().toLLMTool()]);

    expect(result.content).toContain("Error executing tool 'test_tool'");
    expect(result.content).toContain("execution failed");
  });
});
