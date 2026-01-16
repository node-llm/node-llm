import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { GeminiProvider } from "../../../../src/providers/gemini/GeminiProvider.js";
import { GeminiChat } from "../../../../src/providers/gemini/Chat.js";
import { GeminiModels } from "../../../../src/providers/gemini/Models.js";
import { GeminiImage } from "../../../../src/providers/gemini/Image.js";
import { GeminiEmbeddings } from "../../../../src/providers/gemini/Embeddings.js";
import { GeminiTranscription } from "../../../../src/providers/gemini/Transcription.js";
import { ImageRequest, TranscriptionRequest, ModerationRequest, EmbeddingRequest } from "../../../../src/providers/Provider.js";

vi.mock("../../../../src/providers/gemini/Chat.js");
vi.mock("../../../../src/providers/gemini/Streaming.js");
vi.mock("../../../../src/providers/gemini/Models.js");
vi.mock("../../../../src/providers/gemini/Image.js");
vi.mock("../../../../src/providers/gemini/Embeddings.js");
vi.mock("../../../../src/providers/gemini/Transcription.js");

describe("GeminiProvider", () => {
  const options = { apiKey: "test-key" };
  let provider: GeminiProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiProvider(options);
  });

  it("should initialize with default baseUrl if not provided", () => {
    expect(GeminiChat).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta",
      "test-key"
    );
  });

  it("should delegate chat to chatHandler", async () => {
    const request = { model: "test", messages: [] };
    const mockResponse = { content: "ok" };
    (GeminiChat.prototype.execute as unknown as Mock).mockResolvedValue(mockResponse);

    const result = await provider.chat(request);
    expect(result).toBe(mockResponse);
    expect(GeminiChat.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate paint to imageHandler", async () => {
    const request = { prompt: "test" };
    const mockResponse = { images: [] };
    (GeminiImage.prototype.execute as unknown as Mock).mockResolvedValue(mockResponse);
    const result = await provider.paint(request as unknown as ImageRequest);
    expect(result).toBe(mockResponse);
    expect(GeminiImage.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate listModels to modelsHandler", async () => {
    (GeminiModels.prototype.execute as unknown as Mock).mockResolvedValue([]);
    await provider.listModels();
    expect(GeminiModels.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate embed to embeddingHandler", async () => {
    (GeminiEmbeddings.prototype.execute as unknown as Mock).mockResolvedValue({});
    await provider.embed({} as unknown as EmbeddingRequest);
    expect(GeminiEmbeddings.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate transcribe to transcriptionHandler", async () => {
    (GeminiTranscription.prototype.execute as unknown as Mock).mockResolvedValue({});
    await provider.transcribe({} as unknown as TranscriptionRequest);
    expect(GeminiTranscription.prototype.execute).toHaveBeenCalled();
  });

  it("should throw error for moderation", async () => {
    await expect(provider.moderate({} as unknown as ModerationRequest)).rejects.toThrow("Gemini does not support moderate");
  });
});
