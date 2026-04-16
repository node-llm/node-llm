import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { MCPTool } from "./MCPTool.js";
import { MCPResource } from "./MCPResource.js";
import { MCPPrompt } from "./MCPPrompt.js";

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
  private isConnected: boolean = false;

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
   * Helper to quickly connect to a Stdio-based MCP server.
   */
  static async connect(config: StdioConfig): Promise<MCPRegistry> {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: { ...(process.env as any), ...config.env },
      stderr: "pipe"
    });

    if (transport.stderr) {
      transport.stderr.on("data", (chunk) => {
        // We log to stderr so it doesn't pollute actual LLM output
        process.stderr.write(`[MCP Server] ${chunk.toString()}`);
      });
    }

    const registry = new MCPRegistry(transport);
    return registry;
  }

  /**
   * Discovers available tools from the MCP server.
   * Returns an array of MCPTool instances ready to be used in NodeLLM sessions.
   *
   * @phase Phase 1
   */
  async discoverTools(options: DiscoveryOptions = {}): Promise<MCPTool[]> {
    if (!this.isConnected) {
      await this.client.connect(this.transport);
      this.isConnected = true;
    }

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
   * Discovers available resources from the MCP server.
   * Returns an array of resources.
   *
   */
  async discoverResources(): Promise<MCPResource[]> {
    if (!this.isConnected) {
      await this.client.connect(this.transport);
      this.isConnected = true;
    }

    const response = await this.client.listResources();
    return (response.resources || []).map((r) => new MCPResource(this.client, r));
  }

  /**
   * Discovers available prompts from the MCP server.
   * Returns an array of prompts.
   *
   */
  async discoverPrompts(): Promise<MCPPrompt[]> {
    if (!this.isConnected) {
      await this.client.connect(this.transport);
      this.isConnected = true;
    }

    const response = await this.client.listPrompts();
    return (response.prompts || []).map((p) => new MCPPrompt(this.client, p));
  }

  /**
   * Convenience method to discover all capabilities at once.
   * In Phase 1, this returns only tools. In Phase 2+, it aggregates tools, resources, and prompts.
   */
  async discover(options: DiscoveryOptions = {}): Promise<MCPTool[]> {
    return this.discoverTools(options);
  }

  /**
   * Closes the connection to the MCP server.
   */
  async close(): Promise<void> {
    await this.client.close();
  }
}
