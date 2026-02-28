import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { XAIProvider } from "../../../../src/providers/xai/XAIProvider.js";
import { XAIChat } from "../../../../src/providers/xai/Chat.js";
import { XAIModels } from "../../../../src/providers/xai/Models.js";
import { XAIStreaming } from "../../../../src/providers/xai/Streaming.js";

vi.mock("../../../../src/providers/xai/Chat.js");
vi.mock("../../../../src/providers/xai/Streaming.js");
vi.mock("../../../../src/providers/xai/Models.js");

describe("XAIProvider", () => {
  const options = { apiKey: "test-key" };
  let provider: XAIProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new XAIProvider(options);
  });

  it("should initialize with default baseUrl", () => {
    expect(XAIChat).toHaveBeenCalledWith("https://api.x.ai/v1", "test-key");
  });

  it("should initialize with custom baseUrl", () => {
    new XAIProvider({ ...options, baseUrl: "https://custom.api" });
    expect(XAIChat).toHaveBeenCalledWith("https://custom.api", "test-key");
  });

  it("should delegate chat to chatHandler", async () => {
    const request = { model: "test", messages: [] };
    (XAIChat.prototype.execute as unknown as Mock).mockResolvedValue({ content: "ok" });
    await provider.chat(request);
    expect(XAIChat.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate stream to streamingHandler", async () => {
    const request = { model: "test", messages: [] };
    const generator = (async function* () {
      yield { content: "ok" };
    })();
    (XAIStreaming.prototype.execute as unknown as Mock).mockReturnValue(generator);

    const stream = provider.stream(request);
    for await (const chunk of stream) {
      expect(chunk).toEqual({ content: "ok" });
    }
    expect(XAIStreaming.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate listModels to modelsHandler", async () => {
    (XAIModels.prototype.execute as unknown as Mock).mockResolvedValue([]);
    await provider.listModels();
    expect(XAIModels.prototype.execute).toHaveBeenCalled();
  });
});
