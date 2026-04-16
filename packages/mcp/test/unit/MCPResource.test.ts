import { describe, it, expect, vi } from "vitest";
import { MCPResource } from "../../src/MCPResource.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("MCPResource", () => {
  const mockClient = {
    readResource: vi.fn()
  } as unknown as Client;

  const metadata = {
    uri: "test://resource",
    name: "Test Resource",
    description: "A test resource",
    mimeType: "text/plain"
  };

  it("should initialize with metadata", () => {
    const resource = new MCPResource(mockClient, metadata);
    expect(resource.uri).toBe(metadata.uri);
    expect(resource.name).toBe(metadata.name);
    expect(resource.description).toBe(metadata.description);
    expect(resource.mimeType).toBe(metadata.mimeType);
  });

  it("should read resource from client", async () => {
    const resource = new MCPResource(mockClient, metadata);
    const mockResponse = { contents: [{ uri: "test://resource", text: "hello" }] };
    (mockClient.readResource as any).mockResolvedValue(mockResponse);

    const result = await resource.read();
    expect(mockClient.readResource).toHaveBeenCalledWith({ uri: metadata.uri });
    expect(result).toEqual(mockResponse);
  });
});
