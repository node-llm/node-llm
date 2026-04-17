import { Client } from "@modelcontextprotocol/sdk/client/index.js";

/**
 * A wrapper for MCP Prompts that allows for easy discovery and retrieval.
 */
export class MCPPrompt {
  public name: string;
  public description?: string;
  public arguments?: any[];

  constructor(
    private readonly client: Client,
    private readonly metadata: {
      name: string;
      description?: string;
      arguments?: any[];
    }
  ) {
    this.name = metadata.name;
    this.description = metadata.description;
    this.arguments = metadata.arguments;
  }

  /**
   * Retrieves the prompt messages from the MCP server.
   */
  async get(args: Record<string, string> = {}) {
    return this.client.getPrompt({
      name: this.name,
      arguments: args
    });
  }
}
