import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { MCPTool } from "./MCPTool.js";

export interface StdioConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface DiscoveryOptions {
  /**
   * Only include tools with these names.
   */
  filter?: string[];

  /**
   * Optional prefix to prepend to discovered tool names.
   * Useful to avoid collisions between different MCP servers.
   */
  prefix?: string;
}

/**
 * The main orchestrating engine for MCP integration.
 */
export class MCPRegistry {
  private client: Client;

  /**
   * Creates a registry from an existing transport.
   */
  constructor(private readonly transport: Transport) {
    this.client = new Client(
      {
        name: "node-llm-mcp-host",
        version: "1.0.0"
      },
      {
        capabilities: {
          sampling: {}
        }
      }
    );
  }

  /**
   * Ruby-style helper to quickly connect to a Stdio-based MCP server.
   */
  static async connect(config: StdioConfig): Promise<MCPRegistry> {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: { ...(process.env as any), ...config.env }
    });
    const registry = new MCPRegistry(transport);
    return registry;
  }

  /**
   * Establishes a connection to the MCP server and discovers available tools.
   * Returns an array of MCPTool instances ready to be used in NodeLLM sessions.
   */
  async discover(options: DiscoveryOptions = {}): Promise<MCPTool[]> {
    await this.client.connect(this.transport);

    const response = await this.client.listTools();

    let tools = response.tools || [];

    if (options.filter) {
      tools = tools.filter((t) => options.filter!.includes(t.name));
    }

    return tools.map((t) => {
      const metadata = { ...t, originalName: t.name };
      if (options.prefix) {
        metadata.name = `${options.prefix}${t.name}`;
      }
      return new MCPTool(this.client, metadata as any);
    });
  }

  /**
   * Closes the connection to the MCP server.
   */
  async close(): Promise<void> {
    await this.client.close();
  }
}
