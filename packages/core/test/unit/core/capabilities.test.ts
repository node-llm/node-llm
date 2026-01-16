import { describe, it, expect, vi, beforeEach } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const textFilePath = path.resolve(__dirname, "../../../package.json");

class MockLimitedProvider implements Provider {
  public id = "mock-limited";
  public defaultModel(_type?: string) {
    return "limited-model";
  }
  public capabilities = {
    supportsVision: () => false,
    supportsTools: () => false,
    supportsStructuredOutput: () => false,
    supportsEmbeddings: () => false,
    supportsImageGeneration: () => false,
    supportsTranscription: () => false,
    supportsModeration: () => false,
    supportsReasoning: () => false,
    supportsDeveloperRole: () => false,
    getContextWindow: () => 4096
  };

  async chat(_request: ChatRequest): Promise<ChatResponse> {
    return { content: "ok" };
  }

  formatToolResultMessage(toolCallId: string, content: string, options?: { isError?: boolean }): Message {
    return {
      role: "tool",
      tool_call_id: toolCallId,
      content: content,
      isError: options?.isError
    };
  }
}

describe("Chat Capabilities Validation", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
        headers: { get: () => "image/jpeg" }
      }))
    );
  });
  it("should throw error if vision is used on a model that doesn't support it", async () => {
    const provider = new MockLimitedProvider();
    const chat = new Chat(provider, "limited-model");

    await expect(
      chat.ask("Look at this", {
        images: ["https://example.com/img.jpg"]
      })
    ).rejects.toThrow("Model limited-model does not support vision/binary files.");
  });

  it("should throw error if tools are used on a model that doesn't support them", async () => {
    const provider = new MockLimitedProvider();
    const chat = new Chat(provider, "limited-model");

    const tool = {
      type: "function" as const,
      function: { name: "test", parameters: {} },
      handler: async () => "ok"
    };

    await expect(chat.withTool(tool).ask("Use tool")).rejects.toThrow(
      "Model limited-model does not support tool calling."
    );
  });

  it("should NOT throw error for text files even if vision is not supported", async () => {
    const provider = new MockLimitedProvider();
    const chat = new Chat(provider, "limited-model");

    // Mock FileLoader to return text
    // (In real life, FileLoader handles .txt correctly)
    const response = await chat.ask("Read this", {
      files: [textFilePath]
    });

    expect(String(response)).toBe("ok");
  });
});
