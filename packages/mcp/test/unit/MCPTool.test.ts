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

  it("should call client.callTool in execute", async () => {
    mockClient.callTool.mockResolvedValue({
      content: [{ type: "text", text: "Tool Result" }]
    });

    const tool = new MCPTool(mockClient, mockToolMetadata);
    const result = await tool.execute({ query: "hello" });

    expect(mockClient.callTool).toHaveBeenCalledWith({
      name: "test_tool",
      arguments: { query: "hello" }
    });
    expect(result).toBe("Tool Result");
  });

  it("should handle multi-part content from MCP", async () => {
    mockClient.callTool.mockResolvedValue({
      content: [
        { type: "text", text: "Part 1" },
        { type: "text", text: "Part 2" }
      ]
    });

    const tool = new MCPTool(mockClient, mockToolMetadata);
    const result = await tool.execute({});

    expect(result).toBe("Part 1\nPart 2");
  });
});
