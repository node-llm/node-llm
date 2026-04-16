import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/types.js";
import { MCPResource } from "./MCPResource.js";

/**
 * High-level wrapper for an MCP Resource Template.
 * Allows resolving a URI template (e.g., github://{owner}/{repo}/) into a concrete resource.
 */
export class MCPResourceTemplate {
  constructor(
    private readonly client: Client,
    private readonly metadata: ResourceTemplate
  ) {}

  get name(): string {
    return this.metadata.name;
  }

  get description(): string | undefined {
    return this.metadata.description;
  }

  get uriTemplate(): string {
    return this.metadata.uriTemplate;
  }

  get mimeType(): string | undefined {
    return this.metadata.mimeType;
  }

  /**
   * Resolves the template with the given arguments into a concrete MCPResource.
   */
  async resolve(args: Record<string, string | number | boolean>): Promise<MCPResource> {
    // Note: The MCP SDK normally handles template resolution if configured,
    // but here we manually construct the URI from the template for simplicity
    // and let the MCPResource handle the reading.

    let uri = this.uriTemplate;
    for (const [key, value] of Object.entries(args)) {
      uri = uri.replace(`{${key}}`, String(value));
    }

    return new MCPResource(this.client, {
      uri,
      name: `${this.name} (${JSON.stringify(args)})`,
      description: this.description,
      mimeType: this.mimeType
    });
  }
}
