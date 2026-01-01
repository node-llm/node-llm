import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeminiProvider } from "../../../../src/providers/gemini/GeminiProvider.ts";
import { GeminiChat } from "../../../../src/providers/gemini/Chat.ts";
import { GeminiModels } from "../../../../src/providers/gemini/Models.ts";
import { GeminiImage } from "../../../../src/providers/gemini/Image.ts";
import { GeminiEmbeddings } from "../../../../src/providers/gemini/Embeddings.ts";
import { GeminiTranscription } from "../../../../src/providers/gemini/Transcription.ts";

vi.mock("../../../../src/providers/gemini/Chat.ts");
vi.mock("../../../../src/providers/gemini/Streaming.ts");
vi.mock("../../../../src/providers/gemini/Models.ts");
vi.mock("../../../../src/providers/gemini/Image.ts");
vi.mock("../../../../src/providers/gemini/Embeddings.ts");
vi.mock("../../../../src/providers/gemini/Transcription.ts");

describe("GeminiProvider", () => {
  const options = { apiKey: "test-key" };
  let provider: GeminiProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiProvider(options);
  });

  it("should initialize with default baseUrl if not provided", () => {
    expect(GeminiChat).toHaveBeenCalledWith("https://generativelanguage.googleapis.com/v1beta", "test-key");
  });

  it("should delegate chat to chatHandler", async () => {
    const request = { model: "test", messages: [] };
    const mockResponse = { content: "ok" };
    (GeminiChat.prototype.execute as any).mockResolvedValue(mockResponse);

    const result = await provider.chat(request);
    expect(result).toBe(mockResponse);
    expect(GeminiChat.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate paint to imageHandler", async () => {
    const request = { prompt: "test" };
    const mockResponse = { images: [] };
    (GeminiImage.prototype.execute as any).mockResolvedValue(mockResponse);

    const result = await provider.paint(request as any);
    expect(result).toBe(mockResponse);
    expect(GeminiImage.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate listModels to modelsHandler", async () => {
    (GeminiModels.prototype.execute as any).mockResolvedValue([]);
    await provider.listModels();
    expect(GeminiModels.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate embed to embeddingHandler", async () => {
    (GeminiEmbeddings.prototype.execute as any).mockResolvedValue({});
    await provider.embed({} as any);
    expect(GeminiEmbeddings.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate transcribe to transcriptionHandler", async () => {
    (GeminiTranscription.prototype.execute as any).mockResolvedValue({});
    await provider.transcribe({} as any);
    expect(GeminiTranscription.prototype.execute).toHaveBeenCalled();
  });

  it("should throw error for moderation", async () => {
    await expect(provider.moderate({} as any)).rejects.toThrow("Gemini doesn't support moderation");
  });
});
