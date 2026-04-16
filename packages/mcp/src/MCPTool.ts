import { Tool, ToolDefinition } from "@node-llm/core";
import { SchemaStabilizer } from "./SchemaStabilizer.js";

/**
 * A proxy class that converts an MCP Tool into a native NodeLLM Tool.
 */
export class MCPTool extends Tool {
  public name: string;
  public description: string;
  public schema: any;

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
  async execute(args: any): Promise<string> {
    const response = await this.client.callTool({
      name: this.name,
      arguments: args
    });

    if (!response.content || !Array.isArray(response.content)) {
      return "";
    }

    // Concatenate all text parts from the MCP result
    return response.content
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("\n");
  }
}
