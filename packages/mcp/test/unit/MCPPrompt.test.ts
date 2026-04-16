import { describe, it, expect, vi } from "vitest";
import { MCPPrompt } from "../../src/MCPPrompt.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("MCPPrompt", () => {
  const mockClient = {
    getPrompt: vi.fn()
  } as unknown as Client;

  const metadata = {
    name: "test-prompt",
    description: "A test prompt",
    arguments: [{ name: "arg1", description: "First argument", required: true }]
  };

  it("should initialize with metadata", () => {
    const prompt = new MCPPrompt(mockClient, metadata);
    expect(prompt.name).toBe(metadata.name);
    expect(prompt.description).toBe(metadata.description);
    expect(prompt.arguments).toEqual(metadata.arguments);
  });

  it("should get prompt from client", async () => {
    const prompt = new MCPPrompt(mockClient, metadata);
    const mockResponse = {
      messages: [{ role: "user", content: { type: "text", text: "hello world" } }]
    };
    (mockClient.getPrompt as any).mockResolvedValue(mockResponse);

    const args = { arg1: "value1" };
    const result = await prompt.get(args);

    expect(mockClient.getPrompt).toHaveBeenCalledWith({
      name: metadata.name,
      arguments: args
    });
    expect(result).toEqual(mockResponse);
  });
});
