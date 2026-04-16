import { describe, it, expect, vi, beforeEach } from "vitest";
import { MCP } from "../../src/MCP.js";
import * as MCPClient from "@modelcontextprotocol/sdk/client/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

// Mock the MCP Client
vi.mock("@modelcontextprotocol/sdk/client/index.js", () => {
  const MockClient = vi.fn();
  MockClient.prototype.connect = vi.fn().mockResolvedValue(undefined);
  MockClient.prototype.listTools = vi.fn().mockResolvedValue({ tools: [] });
  MockClient.prototype.listResources = vi.fn().mockResolvedValue({ resources: [] });
  MockClient.prototype.listResourceTemplates = vi.fn().mockResolvedValue({ resourceTemplates: [] });
  MockClient.prototype.listPrompts = vi.fn().mockResolvedValue({ prompts: [] });
  MockClient.prototype.close = vi.fn().mockResolvedValue(undefined);
  MockClient.prototype.setNotificationHandler = vi.fn();
  MockClient.prototype.fallbackNotificationHandler = vi.fn();

  return {
    Client: MockClient
  };
});

describe("MCP", () => {
  let mockTransport: Transport;

  beforeEach(() => {
    mockTransport = {} as Transport;
    vi.clearAllMocks();
  });

  it("should initialize with a client", () => {
    const mcp = new MCP(mockTransport);
    expect(mcp).toBeDefined();
    expect(MCPClient.Client).toHaveBeenCalled();
  });

  describe("discoverTools", () => {
    it("should connect the client on first call", async () => {
      const mcp = new MCP(mockTransport);
      const clientInstance = vi.mocked(MCPClient.Client).mock.instances[0] as any;

      await mcp.discoverTools();

      expect(clientInstance.connect).toHaveBeenCalledWith(mockTransport);
    });

    it("should not connect twice", async () => {
      const mcp = new MCP(mockTransport);
      const clientInstance = vi.mocked(MCPClient.Client).mock.instances[0] as any;

      await mcp.discoverTools();
      await mcp.discoverTools();

      expect(clientInstance.connect).toHaveBeenCalledTimes(1);
    });

    it("should apply name filters", async () => {
      const mcp = new MCP(mockTransport);
      const clientInstance = vi.mocked(MCPClient.Client).mock.instances[0] as any;
      vi.mocked(clientInstance.listTools).mockResolvedValue({
        tools: [
          { name: "tool1", inputSchema: { type: "object" } },
          { name: "tool2", inputSchema: { type: "object" } }
        ]
      } as any);

      const tools = await mcp.discoverTools({ filter: ["tool1"] });

      expect(tools).toHaveLength(1);
      expect(tools[0]!.name).toBe("tool1");
    });

    it("should apply name prefixes", async () => {
      const mcp = new MCP(mockTransport);
      const clientInstance = vi.mocked(MCPClient.Client).mock.instances[0] as any;
      vi.mocked(clientInstance.listTools).mockResolvedValue({
        tools: [{ name: "tool1", inputSchema: { type: "object" } }]
      } as any);

      const tools = await mcp.discoverTools({ prefix: "pre_" });

      expect(tools[0]!.name).toBe("pre_tool1");
    });
  });

  describe("discoverResources", () => {
    it("should discover and wrap resources", async () => {
      const mcp = new MCP(mockTransport);
      const clientInstance = vi.mocked(MCPClient.Client).mock.instances[0] as any;
      vi.mocked(clientInstance.listResources).mockResolvedValue({
        resources: [{ uri: "test://res", name: "Test Resource" }]
      } as any);

      const resources = await mcp.discoverResources();

      expect(resources).toHaveLength(1);
      expect(resources[0]!.uri).toBe("test://res");
      expect(clientInstance.listResources).toHaveBeenCalled();
    });
  });

  describe("discoverPrompts", () => {
    it("should discover and wrap prompts", async () => {
      const mcp = new MCP(mockTransport);
      const clientInstance = vi.mocked(MCPClient.Client).mock.instances[0] as any;
      vi.mocked(clientInstance.listPrompts).mockResolvedValue({
        prompts: [{ name: "test-prompt", description: "A test prompt" }]
      } as any);

      const prompts = await mcp.discoverPrompts();

      expect(prompts).toHaveLength(1);
      expect(prompts[0]!.name).toBe("test-prompt");
      expect(clientInstance.listPrompts).toHaveBeenCalled();
    });
  });

  describe("discover", () => {
    it("should return all capabilities in one call", async () => {
      const mcp = new MCP(mockTransport);
      const clientInstance = vi.mocked(MCPClient.Client).mock.instances[0] as any;

      clientInstance.listTools.mockResolvedValue({ tools: [{ name: "t1" }] } as any);
      clientInstance.listResources.mockResolvedValue({ resources: [{ uri: "r1" }] } as any);
      clientInstance.listResourceTemplates.mockResolvedValue({
        resourceTemplates: [{ name: "rt1" }]
      } as any);
      clientInstance.listPrompts.mockResolvedValue({ prompts: [{ name: "p1" }] } as any);

      const result = await mcp.discover();

      expect(result.tools).toHaveLength(1);
      expect(result.resources).toHaveLength(1);
      expect(result.resourceTemplates).toHaveLength(1);
      expect(result.prompts).toHaveLength(1);
    });
  });

  describe("monitoring", () => {
    it("should emit log events from stderr", async () => {
      const mockStderr = { on: vi.fn() };
      const transportWithStderr = { stderr: mockStderr } as any;
      const mcp = new MCP(transportWithStderr);

      const logHandler = vi.fn();
      mcp.on("log", logHandler);

      // Simulate stderr data
      const dataHandler = (mockStderr.on as any).mock.calls.find((c: any) => c[0] === "data")[1];
      dataHandler(Buffer.from("system healthy"));

      expect(logHandler).toHaveBeenCalledWith("system healthy");
    });
  });

  describe("concurrency", () => {
    it("should handle parallel discovery calls without double-connecting", async () => {
      const mcp = new MCP(mockTransport);
      const clientInstance = vi.mocked(MCPClient.Client).mock.instances[0] as any;

      // Simulate a slightly delayed connection
      clientInstance.connect.mockReturnValue(new Promise((resolve) => setTimeout(resolve, 10)));

      await Promise.all([mcp.discoverTools(), mcp.discoverResources(), mcp.discoverPrompts()]);

      expect(clientInstance.connect).toHaveBeenCalledTimes(1);
    });
  });
});
