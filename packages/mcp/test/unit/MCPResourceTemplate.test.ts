import { describe, it, expect, vi, beforeEach } from "vitest";
import { MCPResourceTemplate } from "../../src/MCPResourceTemplate.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("MCPResourceTemplate", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      readResource: vi.fn()
    };
  });

  it("should expose metadata", () => {
    const template = new MCPResourceTemplate(mockClient, {
      name: "Template",
      uriTemplate: "file://{path}",
      description: "Description",
      mimeType: "text/plain"
    });

    expect(template.name).toBe("Template");
    expect(template.uriTemplate).toBe("file://{path}");
    expect(template.description).toBe("Description");
    expect(template.mimeType).toBe("text/plain");
  });

  it("should resolve URI templates", async () => {
    const template = new MCPResourceTemplate(mockClient, {
      name: "File",
      uriTemplate: "file://{owner}/{repo}/docs/{file}.md"
    });

    const resource = await template.resolve({
      owner: "eshaiju",
      repo: "node-llm",
      file: "intro"
    });

    expect(resource.uri).toBe("file://eshaiju/node-llm/docs/intro.md");
    expect(resource.name).toContain("eshaiju");
  });
});
