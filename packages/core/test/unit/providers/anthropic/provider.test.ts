import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { AnthropicProvider } from "../../../../src/providers/anthropic/AnthropicProvider.js";
import { AnthropicChat } from "../../../../src/providers/anthropic/Chat.js";
import { AnthropicModels } from "../../../../src/providers/anthropic/Models.js";
import { ImageRequest, TranscriptionRequest, ModerationRequest, EmbeddingRequest, ModelInfo } from "../../../../src/providers/Provider.js";

vi.mock("../../../../src/providers/anthropic/Chat.js");
vi.mock("../../../../src/providers/anthropic/Streaming.js");
vi.mock("../../../../src/providers/anthropic/Models.js");

describe("AnthropicProvider", () => {
  const options = { apiKey: "test-key" };
  let provider: AnthropicProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new AnthropicProvider(options);
  });

  it("should initialize with custom baseUrl", () => {
    new AnthropicProvider({ ...options, baseUrl: "https://custom.api" });
    expect(AnthropicChat).toHaveBeenCalledWith("https://custom.api", "test-key");
  });

  it("should delegate chat to chatHandler", async () => {
    const request = { model: "test", messages: [] };
    const mockResponse = { content: "ok" };
    (AnthropicChat.prototype.execute as unknown as Mock).mockResolvedValue(mockResponse);

    const result = await provider.chat(request);
    expect(result).toBe(mockResponse);
    expect(AnthropicChat.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate listModels to modelsHandler", async () => {
    const mockModels = [{ id: "m1" } as unknown as ModelInfo];
    (AnthropicModels.prototype.execute as unknown as Mock).mockResolvedValue(mockModels);

    const result = await provider.listModels();
    expect(result).toBe(mockModels);
    expect(AnthropicModels.prototype.execute).toHaveBeenCalled();
  });

  it("should throw errors for unsupported methods", async () => {
    await expect(provider.paint!(({} as unknown) as ImageRequest)).rejects.toThrow("Anthropic does not support paint");
    await expect(provider.transcribe!(({} as unknown) as TranscriptionRequest)).rejects.toThrow(
      "Anthropic does not support transcribe"
    );
    await expect(provider.moderate!(({} as unknown) as ModerationRequest)).rejects.toThrow(
      "Anthropic does not support moderate"
    );
    await expect(provider.embed!(({} as unknown) as EmbeddingRequest)).rejects.toThrow("Anthropic does not support embed");
  });

  describe("capabilities", () => {
    it("should return correct capabilities", () => {
      expect(provider.capabilities?.supportsEmbeddings("any")).toBe(false);
      expect(provider.capabilities?.supportsImageGeneration("any")).toBe(false);
      expect(provider.capabilities?.supportsTranscription("any")).toBe(false);
      expect(provider.capabilities?.supportsModeration("any")).toBe(false);

      // Vision/Tools/StructuredOutput should delegate to Capabilities
      // We don't need to deep test Capabilities here as it has its own unit test
      expect(typeof provider.capabilities?.supportsVision("claude-3-opus")).toBe("boolean");
    });
  });
});
