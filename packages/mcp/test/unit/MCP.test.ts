import { describe, it, expect, vi, beforeEach } from "vitest";
import { MCP } from "../../src/MCP.js";
import { EventEmitter } from "events";

// Mock the SDK components
const mockClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  listTools: vi.fn().mockResolvedValue({ tools: [] }),
  listResources: vi.fn().mockResolvedValue({ resources: [] }),
  listResourceTemplates: vi.fn().mockResolvedValue({ resourceTemplates: [] }),
  listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
  setNotificationHandler: vi.fn(),
  setRequestHandler: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined),
  onerror: vi.fn(),
  onclose: vi.fn()
};

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: vi.fn().mockImplementation(function () {
    return mockClient;
  })
}));

vi.mock("@modelcontextprotocol/sdk/client/stdio.js", () => ({
  StdioClientTransport: vi.fn().mockImplementation(function () {
    return {};
  })
}));

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: vi.fn().mockImplementation(function () {
    return {};
  })
}));

describe("MCP Class", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with a transport and setup handlers", () => {
    const mockTransport = {};
    const mcp = new MCP(mockTransport as any);

    expect(mcp).toBeDefined();
    // Verify notification handlers were set
    expect(mockClient.setNotificationHandler).toHaveBeenCalled();
  });

  it("should handle logging notifications correctly", async () => {
    const mcp = new MCP({} as any);
    const logSpy = vi.fn();
    mcp.onLog(logSpy);

    // Get the handler that was registered
    const handler = (mockClient.setNotificationHandler as any).mock.calls[0][1];

    // Simulate a log notification
    handler({ params: { level: "info", data: "test log" } });

    expect(logSpy).toHaveBeenCalledWith({ level: "info", message: "test log" });
  });

  it("should support the DSL for event registration", () => {
    const mcp = new MCP({} as any);

    const chain = mcp
      .onLog(() => {})
      .onProgress(() => {})
      .onError(() => {});

    expect(chain).toBe(mcp);
  });

  it("should discover tools and map them to MCPTool instances", async () => {
    mockClient.listTools.mockResolvedValueOnce({
      tools: [{ name: "test_tool", description: "A tool", inputSchema: {} }]
    });

    const mcp = new MCP({} as any);
    const tools = await mcp.discoverTools({ prefix: "mcp_" });

    expect(tools.length).toBe(1);
    expect(tools[0].name).toBe("mcp_test_tool");
    expect(mockClient.connect).toHaveBeenCalled();
  });

  it("should detect 'Method Not Found' errors robustly", () => {
    const mcp = new MCP({} as any);
    const isNotFound = (mcp as any).isMethodNotFoundError.bind(mcp);

    expect(isNotFound({ code: -32601 })).toBe(true);
    expect(isNotFound({ message: "Method not found" })).toBe(true);
    expect(isNotFound({ message: "Capability not supported" })).toBe(true);
    expect(isNotFound({ message: "Server does not support this" })).toBe(true);
    expect(isNotFound({ message: "Internal error" })).toBe(false);
  });

  it("should connect to multiple servers via connectAll", async () => {
    const configs = {
      server1: { command: "node", args: ["s1.js"] },
      server2: { url: "http://localhost:3000/sse" }
    };

    const instances = await MCP.connectAll(configs);

    expect(Object.keys(instances)).toEqual(["server1", "server2"]);
    expect(instances.server1).toBeInstanceOf(MCP);
    expect(instances.server2).toBeInstanceOf(MCP);
  });
});
