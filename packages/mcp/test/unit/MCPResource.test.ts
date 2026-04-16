import { describe, it, expect, vi } from "vitest";
import { MCPResource } from "../../src/MCPResource.js";

describe("MCPResource", () => {
  const mockClient = {
    readResource: vi.fn(),
  };

  it("should initialize with metadata", () => {
    const resource = new MCPResource(mockClient as any, {
      uri: "file://test.txt",
      name: "Test Resource",
      mimeType: "text/plain"
    });

    expect(resource.uri).toBe("file://test.txt");
    expect(resource.name).toBe("Test Resource");
    expect(resource.mimeType).toBe("text/plain");
  });

  it("should call readResource on the client", async () => {
    const resource = new MCPResource(mockClient as any, {
      uri: "file://test.txt",
      name: "Test Resource"
    });

    await resource.read();
    expect(mockClient.readResource).toHaveBeenCalledWith({ uri: "file://test.txt" });
  });

  it("should extract and concatenate text via readText()", async () => {
    mockClient.readResource.mockResolvedValueOnce({
      contents: [
        { text: "Hello" },
        { text: "World" },
        { blob: "base64data", mimeType: "image/png" }
      ]
    });

    const resource = new MCPResource(mockClient as any, {
      uri: "file://test.txt",
      name: "Test Resource"
    });

    const text = await resource.readText();
    expect(text).toContain("Hello");
    expect(text).toContain("World");
    expect(text).toContain("[Binary Content: image/png]");
  });

  it("should return empty string if no contents", async () => {
    mockClient.readResource.mockResolvedValueOnce({});

    const resource = new MCPResource(mockClient as any, {
      uri: "file://empty",
      name: "Empty"
    });

    const text = await resource.readText();
    expect(text).toBe("");
  });
});
