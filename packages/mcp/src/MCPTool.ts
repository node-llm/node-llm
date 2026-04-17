import { Tool, ToolDefinition } from "@node-llm/core";
import { SchemaStabilizer } from "./SchemaStabilizer.js";

export interface MCPExecutionResult {
  text?: string;
  data?: unknown;
  resources?: any[]; // Resource references
  raw: unknown; // Raw MCP response
}

/**
 * A proxy class that converts an MCP Tool into a native NodeLLM Tool.
 */
export class MCPTool extends Tool {
  public name: string;
  public description: string;
  public schema: any;
  private readonly originalName: string;

  constructor(
    private readonly client: any, // Client from @modelcontextprotocol/sdk
    private readonly metadata: {
      name: string;
      description?: string;
      inputSchema: any;
    }
  ) {
    super();
    this.name = metadata.name;
    this.originalName = (metadata as any).originalName || metadata.name;
    this.description = metadata.description || "";
    this.schema = metadata.inputSchema;
  }

  /**
   * Overrides the default schema generation to apply MCP-specific stabilization.
   */
  public override toLLMTool(): ToolDefinition {
    const stabilizedSchema = SchemaStabilizer.stabilize(this.schema);

    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        strict: this.strict,
        parameters: stabilizedSchema
      },
      handler: (args: any) => this.handler(args)
    };
  }

  /**
   * Executes the tool by calling the MCP server.
   */
  async execute(args: any): Promise<MCPExecutionResult> {
    try {
      const response = await this.client.callTool({
        name: this.originalName,
        arguments: args
      });

      if (!response.content || !Array.isArray(response.content)) {
        return { raw: response };
      }

      // Separate different content types
      const textParts: string[] = [];
      const dataParts: unknown[] = [];
      const resourceParts: any[] = [];

      for (const part of response.content) {
        switch (part.type) {
          case "text":
            textParts.push(part.text);
            break;
          case "json":
            dataParts.push(part.data);
            break;
          case "resource":
            resourceParts.push(part.resource);
            break;
          default:
            // Handle other content types as data
            dataParts.push(part);
        }
      }

      return {
        text: textParts.length > 0 ? textParts.join("\n") : undefined,
        data: dataParts.length === 1 ? dataParts[0] : dataParts.length > 1 ? dataParts : undefined,
        resources: resourceParts.length > 0 ? resourceParts : undefined,
        raw: response
      };
    } catch (error: any) {
      // MCP Errors often come with a code and message
      const errorCode = error.code ? ` (Code: ${error.code})` : "";
      const errorMessage = `MCP Error in ${this.name}: ${error.message}${errorCode}`;

      return {
        text: errorMessage,
        raw: error
      };
    }
  }
}
