import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { MistralProvider } from "../../../../src/providers/mistral/MistralProvider.js";
import { MistralChat } from "../../../../src/providers/mistral/Chat.js";
import { MistralModels } from "../../../../src/providers/mistral/Models.js";
import { MistralStreaming } from "../../../../src/providers/mistral/Streaming.js";
import { MistralEmbedding } from "../../../../src/providers/mistral/Embedding.js";

vi.mock("../../../../src/providers/mistral/Chat.js");
vi.mock("../../../../src/providers/mistral/Streaming.js");
vi.mock("../../../../src/providers/mistral/Models.js");
vi.mock("../../../../src/providers/mistral/Embedding.js");

describe("MistralProvider", () => {
  const options = { apiKey: "test-key" };
  let provider: MistralProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new MistralProvider(options);
  });

  it("should initialize with default baseUrl", () => {
    expect(MistralChat).toHaveBeenCalledWith("https://api.mistral.ai/v1", "test-key");
  });

  it("should initialize with custom baseUrl", () => {
    new MistralProvider({ ...options, baseUrl: "https://custom.api" });
    expect(MistralChat).toHaveBeenCalledWith("https://custom.api", "test-key");
  });

  it("should delegate chat to chatHandler", async () => {
    const request = { model: "mistral-large-latest", messages: [] };
    (MistralChat.prototype.execute as unknown as Mock).mockResolvedValue({ content: "ok" });
    await provider.chat(request);
    expect(MistralChat.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate stream to streamingHandler", async () => {
    const request = { model: "mistral-large-latest", messages: [] };
    const generator = (async function* () {
      yield { content: "ok" };
    })();
    (MistralStreaming.prototype.execute as unknown as Mock).mockReturnValue(generator);

    const stream = provider.stream(request);
    for await (const chunk of stream) {
      expect(chunk).toEqual({ content: "ok" });
    }
    expect(MistralStreaming.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate listModels to modelsHandler", async () => {
    (MistralModels.prototype.execute as unknown as Mock).mockResolvedValue([]);
    await provider.listModels();
    expect(MistralModels.prototype.execute).toHaveBeenCalled();
  });

  it("should delegate embed to embeddingHandler", async () => {
    const request = { input: "test", model: "mistral-embed" };
    (MistralEmbedding.prototype.execute as unknown as Mock).mockResolvedValue({
      vectors: [[0.1, 0.2]],
      model: "mistral-embed",
      input_tokens: 2,
      dimensions: 1024
    });
    await provider.embed(request);
    expect(MistralEmbedding.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should have correct provider id", () => {
    expect(provider.id).toBe("Mistral");
  });

  it("should return correct default model", () => {
    expect(provider.defaultModel()).toBe("mistral-large-latest");
    expect(provider.defaultModel("embeddings")).toBe("mistral-embed");
  });
});
