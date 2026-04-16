import { Client } from "@modelcontextprotocol/sdk/client/index.js";

/**
 * A wrapper for MCP Resources that allows for easy discovery and reading.
 */
export class MCPResource {
  public uri: string;
  public name: string;
  public description?: string;
  public mimeType?: string;

  constructor(
    private readonly client: Client,
    private readonly metadata: {
      uri: string;
      name: string;
      description?: string;
      mimeType?: string;
    }
  ) {
    this.uri = metadata.uri;
    this.name = metadata.name;
    this.description = metadata.description;
    this.mimeType = metadata.mimeType;
  }

  /**
   * Reads the resource content from the MCP server.
   */
  async read() {
    return this.client.readResource({ uri: this.uri });
  }
}
