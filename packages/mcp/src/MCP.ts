import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { EventEmitter } from "events";
import { MCPTool } from "./MCPTool.js";
import { MCPResource } from "./MCPResource.js";
import { MCPPrompt } from "./MCPPrompt.js";
import { MCPResourceTemplate } from "./MCPResourceTemplate.js";

export interface StdioConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface SSEConfig {
  url: string;
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
 * Acts as the entry point for connecting to servers and discovering capabilities.
 *
 * Emits:
 * - 'log': When the server sends a log message to stderr
 * - 'notification': When the server sends a protocol notification
 */
export class MCP extends EventEmitter {
  private client: Client;
  private isConnected: boolean = false;
  private _connecting?: Promise<void>;

  /**
   * Creates an MCP instance from an existing transport.
   */
  constructor(private readonly transport: Transport) {
    super();
    this.client = new Client(
      {
        name: "node-llm-mcp-host",
        version: "1.0.0"
      },
      {
        capabilities: {
          sampling: {}
        },
        // Setup internal notification handlers for protocol events
        listChanged: {
          tools: {
            onChanged: (error, tools) =>
              this.emit("notification", { type: "tools_changed", error, tools })
          },
          resources: {
            onChanged: (error, resources) =>
              this.emit("notification", { type: "resources_changed", error, resources })
          },
          prompts: {
            onChanged: (error, prompts) =>
              this.emit("notification", { type: "prompts_changed", error, prompts })
          }
        }
      }
    );

    // Setup stderr monitoring if available
    const stdioTransport = transport as any;
    if (stdioTransport.stderr) {
      stdioTransport.stderr.on("data", (chunk: Buffer) => {
        this.emit("log", chunk.toString());
      });
    }

    // Capture explicit protocol logging notifications
    this.client.setNotificationHandler(LoggingMessageNotificationSchema, (notification) => {
      this.emit("log", notification.params.data);
    });

    // Capture all other notifications via fallback
    (this.client as any).fallbackNotificationHandler = async (notification: any) => {
      this.emit("notification", notification);
    };

    // Global Error & Closure Monitoring
    this.client.onerror = (error) => {
      this.emit("error", error);
    };

    this.client.onclose = () => {
      this.isConnected = false;
      this.emit("close");
    };
  }

  /**
   * Helper to quickly connect to a Stdio-based MCP server.
   */
  static async connect(config: StdioConfig): Promise<MCP> {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: { ...(process.env as any), ...config.env },
      stderr: "pipe"
    });

    return new MCP(transport);
  }

  /**
   * Helper to quickly connect to an SSE-based MCP server (HTTP).
   *
   */
  static async connectSSE(config: SSEConfig): Promise<MCP> {
    const transport = new StreamableHTTPClientTransport(new URL(config.url));
    return new MCP(transport);
  }

  /**
   * Internal helper to handle connection deduplication and thread-safety.
   */
  private async ensureConnected(): Promise<void> {
    if (this.isConnected) return;
    if (this._connecting) return this._connecting;

    this._connecting = this.client
      .connect(this.transport)
      .then(() => {
        this.isConnected = true;
        this._connecting = undefined;
      })
      .catch((err) => {
        this._connecting = undefined;
        throw err;
      });

    return this._connecting;
  }

  /**
   * Discovers available tools from the MCP server.
   * Returns an array of MCPTool instances ready to be used in NodeLLM sessions.
   *
   * @phase Phase 1
   */
  async discoverTools(options: DiscoveryOptions = {}): Promise<MCPTool[]> {
    await this.ensureConnected();
    try {
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
    } catch (err) {
      if (this.isMethodNotFoundError(err)) return [];
      throw err;
    }
  }

  /**
   * Discovers available resources from the MCP server.
   * Returns an array of resources.
   *
   */
  async discoverResources(options: DiscoveryOptions = {}): Promise<MCPResource[]> {
    await this.ensureConnected();
    try {
      const response = await this.client.listResources();
      let resources = response.resources || [];

      if (options.filter) {
        resources = resources.filter((r) => options.filter!.includes(r.name));
      }

      return resources.map((r) => {
        const metadata = { ...r };
        if (options.prefix) {
          metadata.name = `${options.prefix}${r.name}`;
        }
        return new MCPResource(this.client, metadata);
      });
    } catch (err) {
      if (this.isMethodNotFoundError(err)) return [];
      throw err;
    }
  }

  /**
   * Discovers available resource templates from the MCP server.
   * Returns an array of templates.
   *
   */
  async discoverResourceTemplates(options: DiscoveryOptions = {}): Promise<MCPResourceTemplate[]> {
    await this.ensureConnected();
    try {
      const response = await this.client.listResourceTemplates();
      let templates = response.resourceTemplates || [];

      if (options.filter) {
        templates = templates.filter((t: any) => options.filter!.includes(t.name));
      }

      return templates.map((t: any) => {
        const metadata = { ...t };
        if (options.prefix) {
          metadata.name = `${options.prefix}${t.name}`;
        }
        return new MCPResourceTemplate(this.client, metadata);
      });
    } catch (err) {
      if (this.isMethodNotFoundError(err)) return [];
      throw err;
    }
  }

  /**
   * Discovers available prompts from the MCP server.
   * Returns an array of prompts.
   *
   */
  async discoverPrompts(options: DiscoveryOptions = {}): Promise<MCPPrompt[]> {
    await this.ensureConnected();
    try {
      const response = await this.client.listPrompts();
      let prompts = response.prompts || [];

      if (options.filter) {
        prompts = prompts.filter((p) => options.filter!.includes(p.name));
      }

      return prompts.map((p) => {
        const metadata = { ...p };
        if (options.prefix) {
          metadata.name = `${options.prefix}${p.name}`;
        }
        return new MCPPrompt(this.client, metadata);
      });
    } catch (err) {
      if (this.isMethodNotFoundError(err)) return [];
      throw err;
    }
  }

  /**
   * Internal helper to detect if an error is a "Method Not Found" (capability not supported).
   */
  private isMethodNotFoundError(err: any): boolean {
    return (
      err.code === -32601 ||
      err.error?.code === -32601 ||
      err.message?.includes("-32601") ||
      err.message?.includes("Method not found")
    );
  }

  /**
   * Convenience method to discover all capabilities at once.
   * Returns an object containing all discovered tools, resources, and prompts.
   */
  async discover(options: DiscoveryOptions = {}): Promise<{
    tools: MCPTool[];
    resources: MCPResource[];
    resourceTemplates: MCPResourceTemplate[];
    prompts: MCPPrompt[];
  }> {
    const [tools, resources, resourceTemplates, prompts] = await Promise.all([
      this.discoverTools(options),
      this.discoverResources(options),
      this.discoverResourceTemplates(options),
      this.discoverPrompts(options)
    ]);

    return { tools, resources, resourceTemplates, prompts };
  }

  /**
   * Closes the connection to the MCP server.
   */
  async close(): Promise<void> {
    await this.client.close();
  }
}
