import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicProvider } from "../../../../src/providers/anthropic/AnthropicProvider.ts";
import { AnthropicChat } from "../../../../src/providers/anthropic/Chat.ts";
import { AnthropicStreaming } from "../../../../src/providers/anthropic/Streaming.ts";
import { AnthropicModels } from "../../../../src/providers/anthropic/Models.ts";

vi.mock("../../../../src/providers/anthropic/Chat.ts");
vi.mock("../../../../src/providers/anthropic/Streaming.ts");
vi.mock("../../../../src/providers/anthropic/Models.ts");

describe("AnthropicProvider", () => {
  const options = { apiKey: "test-key" };
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new AnthropicProvider(options);
  });

  it("should initialize with custom baseUrl", () => {
    const customProvider = new AnthropicProvider({ ...options, baseUrl: "https://custom.api" });
    expect(AnthropicChat).toHaveBeenCalledWith("https://custom.api", "test-key");
  });

  it("should delegate chat to chatHandler", async () => {
    const request = { model: "test", messages: [] };
    const mockResponse = { content: "ok" };
    (AnthropicChat.prototype.execute as any).mockResolvedValue(mockResponse);

    const result = await provider.chat(request);
    expect(result).toBe(mockResponse);
    expect(AnthropicChat.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate listModels to modelsHandler", async () => {
    const mockModels = [{ id: "m1" } as any];
    (AnthropicModels.prototype.execute as any).mockResolvedValue(mockModels);

    const result = await provider.listModels();
    expect(result).toBe(mockModels);
    expect(AnthropicModels.prototype.execute).toHaveBeenCalled();
  });

  it("should throw errors for unsupported methods", async () => {
    await expect(provider.paint({} as any)).rejects.toThrow("Anthropic doesn't support image generation");
    await expect(provider.transcribe({} as any)).rejects.toThrow("Anthropic doesn't support transcription");
    await expect(provider.moderate({} as any)).rejects.toThrow("Anthropic doesn't support moderation");
    await expect(provider.embed({} as any)).rejects.toThrow("Anthropic doesn't support embeddings");
  });

  describe("capabilities", () => {
    it("should return correct capabilities", () => {
      expect(provider.capabilities.supportsEmbeddings("any")).toBe(false);
      expect(provider.capabilities.supportsImageGeneration("any")).toBe(false);
      expect(provider.capabilities.supportsTranscription("any")).toBe(false);
      expect(provider.capabilities.supportsModeration("any")).toBe(false);
      
      // Vision/Tools/StructuredOutput should delegate to Capabilities
      // We don't need to deep test Capabilities here as it has its own unit test
      expect(typeof provider.capabilities.supportsVision("claude-3-opus")).toBe("boolean");
    });
  });
});
