import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIProvider } from "../../../../src/providers/openai/OpenAIProvider.ts";
import { OpenAIChat } from "../../../../src/providers/openai/Chat.ts";
import { OpenAIModels } from "../../../../src/providers/openai/Models.ts";
import { OpenAIImage } from "../../../../src/providers/openai/Image.ts";
import { OpenAIEmbedding } from "../../../../src/providers/openai/Embedding.ts";
import { OpenAITranscription } from "../../../../src/providers/openai/Transcription.ts";
import { OpenAIModeration } from "../../../../src/providers/openai/Moderation.ts";

vi.mock("../../../../src/providers/openai/Chat.ts");
vi.mock("../../../../src/providers/openai/Streaming.ts");
vi.mock("../../../../src/providers/openai/Models.ts");
vi.mock("../../../../src/providers/openai/Image.ts");
vi.mock("../../../../src/providers/openai/Embedding.ts");
vi.mock("../../../../src/providers/openai/Transcription.ts");
vi.mock("../../../../src/providers/openai/Moderation.ts");

describe("OpenAIProvider", () => {
  const options = { apiKey: "test-key" };
  let provider: OpenAIProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider(options);
  });

  it("should initialize with custom baseUrl", () => {
    const customProvider = new OpenAIProvider({ ...options, baseUrl: "https://custom.api" });
    expect(OpenAIChat).toHaveBeenCalledWith("https://custom.api", "test-key");
  });

  it("should delegate chat to chatHandler", async () => {
    const request = { model: "test", messages: [] };
    (OpenAIChat.prototype.execute as any).mockResolvedValue({ content: "ok" });
    await provider.chat(request);
    expect(OpenAIChat.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate listModels to modelsHandler", async () => {
    (OpenAIModels.prototype.execute as any).mockResolvedValue([]);
    await provider.listModels();
    expect(OpenAIModels.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate paint to imageHandler", async () => {
    (OpenAIImage.prototype.execute as any).mockResolvedValue({});
    await provider.paint({} as any);
    expect(OpenAIImage.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate transcribe to transcriptionHandler", async () => {
    (OpenAITranscription.prototype.execute as any).mockResolvedValue({});
    await provider.transcribe({} as any);
    expect(OpenAITranscription.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate moderate to moderationHandler", async () => {
    (OpenAIModeration.prototype.execute as any).mockResolvedValue({});
    await provider.moderate({} as any);
    expect(OpenAIModeration.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate embed to embeddingHandler", async () => {
    (OpenAIEmbedding.prototype.execute as any).mockResolvedValue({});
    await provider.embed({} as any);
    expect(OpenAIEmbedding.prototype.execute).toHaveBeenCalled();
  });
});
