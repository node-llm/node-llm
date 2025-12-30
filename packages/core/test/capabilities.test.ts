import { describe, it, expect } from "vitest";
import { Chat } from "../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse } from "../src/providers/Provider.js";

class MockLimitedProvider implements Provider {
  public capabilities = {
    supportsVision: () => false,
    supportsTools: () => false,
    supportsStructuredOutput: () => false,
    getContextWindow: () => 4096,
  };

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return { content: "ok" };
  }
}

describe("Chat Capabilities Validation", () => {
  it("should throw error if vision is used on a model that doesn't support it", async () => {
    const provider = new MockLimitedProvider();
    const chat = new Chat(provider, "limited-model");

    await expect(chat.ask("Look at this", {
      images: ["https://example.com/img.jpg"]
    })).rejects.toThrow("Model limited-model does not support vision/binary files.");
  });

  it("should throw error if tools are used on a model that doesn't support them", async () => {
    const provider = new MockLimitedProvider();
    const chat = new Chat(provider, "limited-model");

    const tool = {
      type: "function" as const,
      function: { name: "test", parameters: {} },
      handler: async () => "ok"
    };

    await expect(chat.withTool(tool).ask("Use tool")).rejects.toThrow("Model limited-model does not support tool calling.");
  });

  it("should NOT throw error for text files even if vision is not supported", async () => {
    const provider = new MockLimitedProvider();
    const chat = new Chat(provider, "limited-model");

    // Mock FileLoader to return text
    // (In real life, FileLoader handles .txt correctly)
    const response = await chat.ask("Read this", {
      files: ["../../README.md"] 
    });

    expect(String(response)).toBe("ok");
  });
});
