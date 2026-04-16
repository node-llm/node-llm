import { describe, it, expect, vi, beforeEach } from "vitest";
import { MCPTool } from "../../src/MCPTool.js";

describe("MCPTool", () => {
  const mockClient = {
    callTool: vi.fn()
  } as any;

  const mockToolMetadata = {
    name: "test_tool",
    description: "A test tool",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" }
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with correct metadata", () => {
    const tool = new MCPTool(mockClient, mockToolMetadata);
    expect(tool.name).toBe("test_tool");
    expect(tool.description).toBe("A test tool");
  });

  it("should stabilize schema in toLLMTool", () => {
    const metadataWithBadSchema = {
      ...mockToolMetadata,
      inputSchema: {
        type: "object",
        $schema: "skip-this"
        // missing properties
      }
    };
    const tool = new MCPTool(mockClient, metadataWithBadSchema as any);
    const llmTool = tool.toLLMTool();

    expect(llmTool.function.parameters).toHaveProperty("properties");
    expect(llmTool.function.parameters).not.toHaveProperty("$schema");
  });

  describe("execute()", () => {
    it("should call client.callTool with correct arguments", async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{ type: "text", text: "Tool Result" }]
      });

      const tool = new MCPTool(mockClient, mockToolMetadata);
      await tool.execute({ query: "hello" });

      expect(mockClient.callTool).toHaveBeenCalledWith({
        name: "test_tool",
        arguments: { query: "hello" }
      });
    });

    it("should return structured result with text content", async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{ type: "text", text: "Tool Result" }]
      });

      const tool = new MCPTool(mockClient, mockToolMetadata);
      const result = await tool.execute({});

      expect(result.text).toBe("Tool Result");
      expect(result.data).toBeUndefined();
      expect(result.resources).toBeUndefined();
      expect(result.raw).toBeDefined();
    });

    it("should preserve structured data content", async () => {
      const mockData = { key: "value", nested: { prop: 123 } };
      mockClient.callTool.mockResolvedValue({
        content: [{ type: "json", data: mockData }]
      });

      const tool = new MCPTool(mockClient, mockToolMetadata);
      const result = await tool.execute({});

      expect(result.text).toBeUndefined();
      expect(result.data).toEqual(mockData);
      expect(result.resources).toBeUndefined();
    });

    it("should preserve resource references", async () => {
      const mockResourceData = { uri: "file:///test", name: "Test Resource" };
      mockClient.callTool.mockResolvedValue({
        content: [{ type: "resource", resource: mockResourceData }]
      });

      const tool = new MCPTool(mockClient, mockToolMetadata);
      const result = await tool.execute({});

      expect(result.text).toBeUndefined();
      expect(result.resources).toHaveLength(1);
      expect(result.resources?.[0]).toEqual(mockResourceData);
    });

    it("should handle mixed content types", async () => {
      mockClient.callTool.mockResolvedValue({
        content: [
          { type: "text", text: "Part 1" },
          { type: "text", text: "Part 2" },
          { type: "json", data: { result: "data" } }
        ]
      });

      const tool = new MCPTool(mockClient, mockToolMetadata);
      const result = await tool.execute({});

      expect(result.text).toBe("Part 1\nPart 2");
      expect(result.data).toEqual({ result: "data" }); // Single data element returns as object
    });

    it("should return data array when multiple data parts present", async () => {
      mockClient.callTool.mockResolvedValue({
        content: [
          { type: "json", data: { result: "data1" } },
          { type: "json", data: { result: "data2" } }
        ]
      });

      const tool = new MCPTool(mockClient, mockToolMetadata);
      const result = await tool.execute({});

      expect(result.data).toEqual([{ result: "data1" }, { result: "data2" }]);
    });

    it("should handle empty content array", async () => {
      mockClient.callTool.mockResolvedValue({
        content: []
      });

      const tool = new MCPTool(mockClient, mockToolMetadata);
      const result = await tool.execute({});

      expect(result.text).toBeUndefined();
      expect(result.data).toBeUndefined();
    });

    it("should handle null content gracefully", async () => {
      mockClient.callTool.mockResolvedValue({
        content: null
      });

      const tool = new MCPTool(mockClient, mockToolMetadata);
      const result = await tool.execute({});

      expect(result.raw).toBeDefined();
    });

    it("should handle execution errors gracefully", async () => {
      mockClient.callTool.mockRejectedValue(new Error("Tool execution failed"));

      const tool = new MCPTool(mockClient, mockToolMetadata);
      const result = await tool.execute({});

      expect(result.text).toContain("MCP Error in test_tool");
      expect(result.text).toContain("Tool execution failed");
    });

    it("should include error code in error messages when available", async () => {
      const error = new Error("Custom error");
      (error as any).code = -32000;
      mockClient.callTool.mockRejectedValue(error);

      const tool = new MCPTool(mockClient, mockToolMetadata);
      const result = await tool.execute({});

      expect(result.text).toContain("Code: -32000");
    });
  });
});
