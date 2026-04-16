import { describe, it, expect, vi, beforeEach } from "vitest";
import { MCPRegistry } from "../../src/MCPRegistry.js";
import { MCPTool } from "../../src/MCPTool.js";

// Mock the MCP Client
vi.mock("@modelcontextprotocol/sdk/client/index.js", () => {
  const mockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({
      tools: [
        { name: "tool1", inputSchema: { type: "object" } },
        { name: "tool2", inputSchema: { type: "object" } }
      ]
    }),
    listResources: vi.fn().mockResolvedValue({
      resources: [
        { uri: "file:///1", name: "res1" },
        { uri: "file:///2", name: "res2" }
      ]
    })
  };
  return {
    Client: vi.fn().mockImplementation(function () {
      return mockClient;
    })
  };
});

describe("MCPRegistry", () => {
  const mockTransport = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("discoverTools()", () => {
    it("should connect and discover tools", async () => {
      const registry = new MCPRegistry(mockTransport);
      const tools = await registry.discoverTools();

      expect(tools).toHaveLength(2);
      expect(tools[0]).toBeInstanceOf(MCPTool);
      expect(tools[0]?.name).toBe("tool1");
      expect(tools[1]?.name).toBe("tool2");
    });

    it("should filter tools by name if requested", async () => {
      const registry = new MCPRegistry(mockTransport);
      const tools = await registry.discoverTools({ filter: ["tool1"] });

      expect(tools).toHaveLength(1);
      expect(tools[0]?.name).toBe("tool1");
    });

    it("should apply prefix to tool names if provided", async () => {
      const registry = new MCPRegistry(mockTransport);
      const tools = await registry.discoverTools({ prefix: "mcp_" });

      expect(tools[0]?.name).toBe("mcp_tool1");
      expect(tools[1]?.name).toBe("mcp_tool2");
    });

    it("should preserve original tool name in metadata", async () => {
      const registry = new MCPRegistry(mockTransport);
      const tools = await registry.discoverTools({ prefix: "test_" });

      expect((tools[0] as any).originalName).toBe("tool1");
    });
  });

  describe("discover()", () => {
    it("should delegate to discoverTools() in Phase 1", async () => {
      const registry = new MCPRegistry(mockTransport);
      const tools = await registry.discover();

      expect(tools).toHaveLength(2);
      expect(tools[0]).toBeInstanceOf(MCPTool);
      expect(tools[0]?.name).toBe("tool1");
    });

    it("should support same options as discoverTools()", async () => {
      const registry = new MCPRegistry(mockTransport);
      const tools = await registry.discover({ prefix: "test_", filter: ["tool2"] });

      expect(tools).toHaveLength(1);
      expect(tools[0]?.name).toBe("test_tool2");
    });
  });

  describe("discoverResources()", () => {
    it("should return empty array in Phase 1", async () => {
      const registry = new MCPRegistry(mockTransport);
      const resources = await registry.discoverResources();

      expect(resources).toEqual([]);
    });
  });

  describe("discoverPrompts()", () => {
    it("should return empty array in Phase 1", async () => {
      const registry = new MCPRegistry(mockTransport);
      const prompts = await registry.discoverPrompts();

      expect(prompts).toEqual([]);
    });
  });

  it("should close transport on close()", async () => {
    const registry = new MCPRegistry(mockTransport);
    await registry.close();
    // Transport doesn't have a specific mock yet but we can
    // verify the client's internal logout/close if available.
    // For now, we'll ensure it doesn't throw.
  });
});
