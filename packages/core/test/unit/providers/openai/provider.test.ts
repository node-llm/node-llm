import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { OpenAIProvider } from "../../../../src/providers/openai/OpenAIProvider.js";
import { OpenAIChat } from "../../../../src/providers/openai/Chat.js";
import { OpenAIModels } from "../../../../src/providers/openai/Models.js";
import { OpenAIImage } from "../../../../src/providers/openai/Image.js";
import { OpenAIEmbedding } from "../../../../src/providers/openai/Embedding.js";
import { OpenAITranscription } from "../../../../src/providers/openai/Transcription.js";
import { OpenAIModeration } from "../../../../src/providers/openai/Moderation.js";
import { ImageRequest, TranscriptionRequest, ModerationRequest, EmbeddingRequest } from "../../../../src/providers/Provider.js";

vi.mock("../../../../src/providers/openai/Chat.js");
vi.mock("../../../../src/providers/openai/Streaming.js");
vi.mock("../../../../src/providers/openai/Models.js");
vi.mock("../../../../src/providers/openai/Image.js");
vi.mock("../../../../src/providers/openai/Embedding.js");
vi.mock("../../../../src/providers/openai/Transcription.js");
vi.mock("../../../../src/providers/openai/Moderation.js");

describe("OpenAIProvider", () => {
  const options = { apiKey: "test-key" };
  let provider: OpenAIProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider(options);
  });

  it("should initialize with custom baseUrl", () => {
    const customProvider = new OpenAIProvider({ ...options, baseUrl: "https://custom.api" });
    expect(OpenAIChat).toHaveBeenCalledWith(customProvider, "test-key");
  });

  it("should delegate chat to chatHandler", async () => {
    const request = { model: "test", messages: [] };
    (OpenAIChat.prototype.execute as unknown as Mock).mockResolvedValue({ content: "ok" });
    await provider.chat(request);
    expect(OpenAIChat.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate listModels to modelsHandler", async () => {
    (OpenAIModels.prototype.execute as unknown as Mock).mockResolvedValue([]);
    await provider.listModels();
    expect(OpenAIModels.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate paint to imageHandler", async () => {
    (OpenAIImage.prototype.execute as unknown as Mock).mockResolvedValue({});
    await provider.paint({} as unknown as ImageRequest);
    expect(OpenAIImage.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate transcribe to transcriptionHandler", async () => {
    (OpenAITranscription.prototype.execute as unknown as Mock).mockResolvedValue({});
    await provider.transcribe({} as unknown as TranscriptionRequest);
    expect(OpenAITranscription.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate moderate to moderationHandler", async () => {
    (OpenAIModeration.prototype.execute as unknown as Mock).mockResolvedValue({});
    await provider.moderate({} as unknown as ModerationRequest);
    expect(OpenAIModeration.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate embed to embeddingHandler", async () => {
    (OpenAIEmbedding.prototype.execute as unknown as Mock).mockResolvedValue({});
    await provider.embed({} as unknown as EmbeddingRequest);
    expect(OpenAIEmbedding.prototype.execute).toHaveBeenCalled();
  });
});
