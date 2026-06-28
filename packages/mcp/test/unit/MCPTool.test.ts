import { describe, it, expect, vi } from "vitest";
import { MCPTool } from "../../src/MCPTool.js";

describe("MCPTool", () => {
  const mockClient = {
    callTool: vi.fn()
  };

  it("should initialize with metadata", () => {
    const tool = new MCPTool(mockClient as any, {
      name: "test_tool",
      description: "Test Description",
      inputSchema: { type: "object", properties: {} }
    });

    expect(tool.name).toBe("test_tool");
    expect(tool.description).toBe("Test Description");
    expect(tool.schema).toEqual({ type: "object", properties: {} });
  });

  it("should execute and flatten multi-part content", async () => {
    mockClient.callTool.mockResolvedValueOnce({
      content: [
        { type: "text", text: "Tool output" },
        { type: "json", data: { result: 42 } }
      ]
    });

    const tool = new MCPTool(mockClient as any, {
      name: "test_tool",
      inputSchema: {}
    });

    const result = await tool.execute({});
    expect(result.text).toBe("Tool output");
    expect(result.data).toEqual({ result: 42 });
    expect(mockClient.callTool).toHaveBeenCalledWith({
      name: "test_tool",
      arguments: {}
    });
  });

  it("should handle execution errors gracefully", async () => {
    mockClient.callTool.mockRejectedValueOnce(new Error("Server error"));

    const tool = new MCPTool(mockClient as any, {
      name: "failing_tool",
      inputSchema: {}
    });

    const result = await tool.execute({});
    expect(result.text).toContain("MCP Error in failing_tool: Server error");
    expect(result.raw).toBeDefined();
  });

  it("should support original name for protocol calls", async () => {
    mockClient.callTool.mockResolvedValueOnce({ content: [] });

    const tool = new MCPTool(
      mockClient as any,
      {
        name: "prefix_tool",
        inputSchema: {}
      } as any
    );
    // Mimic how MCP.ts sets originalName
    (tool as any).originalName = "tool";

    await tool.execute({});
    expect(mockClient.callTool).toHaveBeenCalledWith({
      name: "tool",
      arguments: {}
    });
  });
});
