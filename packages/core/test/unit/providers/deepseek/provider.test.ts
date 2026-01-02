import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepSeekProvider } from "../../../../src/providers/deepseek/DeepSeekProvider.js";
import { DeepSeekChat } from "../../../../src/providers/deepseek/Chat.js";
import { DeepSeekModels } from "../../../../src/providers/deepseek/Models.js";
import { DeepSeekStreaming } from "../../../../src/providers/deepseek/Streaming.js";

vi.mock("../../../../src/providers/deepseek/Chat.js");
vi.mock("../../../../src/providers/deepseek/Streaming.js");
vi.mock("../../../../src/providers/deepseek/Models.js");

describe("DeepSeekProvider", () => {
  const options = { apiKey: "test-key" };
  let provider: DeepSeekProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new DeepSeekProvider(options);
  });

  it("should initialize with default baseUrl", () => {
     // Checking constructor side effects via mock calls if needed or default behavior
     // Since baseUrl is private, we infer from what mock was called with
     expect(DeepSeekChat).toHaveBeenCalledWith("https://api.deepseek.com", "test-key");
  });

  it("should initialize with custom baseUrl", () => {
    const customProvider = new DeepSeekProvider({ ...options, baseUrl: "https://custom.api" });
    expect(DeepSeekChat).toHaveBeenCalledWith("https://custom.api", "test-key");
  });

  it("should delegate chat to chatHandler", async () => {
    const request = { model: "test", messages: [] };
    // @ts-ignore
    DeepSeekChat.prototype.execute.mockResolvedValue({ content: "ok" });
    await provider.chat(request);
    expect(DeepSeekChat.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate stream to streamingHandler", async () => {
      const request = { model: "test", messages: [] };
      const generator = (async function*() { yield { content: "ok" }; })();
      // @ts-ignore
      DeepSeekStreaming.prototype.execute.mockReturnValue(generator);
      
      const stream = provider.stream(request);
      for await (const chunk of stream) {
          expect(chunk).toEqual({ content: "ok" });
      }
      expect(DeepSeekStreaming.prototype.execute).toHaveBeenCalledWith(request);
  });

  it("should delegate listModels to modelsHandler", async () => {
    // @ts-ignore
    DeepSeekModels.prototype.execute.mockResolvedValue([]);
    await provider.listModels();
    expect(DeepSeekModels.prototype.execute).toHaveBeenCalled();
  });
});
