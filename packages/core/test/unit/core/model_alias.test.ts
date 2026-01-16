import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLLM } from "../../../src/llm.js";
import { providerRegistry } from "../../../src/providers/registry.js";
import { FakeProvider } from "../../fake-provider.js";
import { Provider } from "../../../src/providers/Provider.js";

// Mock aliases
vi.mock("../../../src/aliases.js", () => ({
  default: {
    "test-alias": {
      fake: "resolved-model-id"
    },
    // Real-world examples
    "gpt-4o": {
      openai: "gpt-4o",
      openrouter: "openai/gpt-4o"
    },
    "claude-3-5-sonnet": {
      anthropic: "claude-3-5-sonnet-20241022",
      bedrock: "anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  }
}));

class MockProvider extends FakeProvider implements Provider {
  id = "fake";
  capabilities = {
    supportsVision: (_m: string) => true,
    supportsTools: (_m: string) => true,
    supportsStructuredOutput: (_m: string) => true,
    supportsEmbeddings: (_m: string) => true,
    supportsImageGeneration: (_m: string) => true,
    supportsTranscription: (_m: string) => true,
    supportsModeration: (_m: string) => true,
    supportsReasoning: (_m: string) => true,
    supportsDeveloperRole: (_m: string) => true,
    getContextWindow: (_m: string) => 1000
  };

  async paint(_req: unknown) {
    return { url: "ok", b64_json: "" };
  }
  async transcribe(_req: unknown) {
    return { text: "ok", segments: [], model: "resolved-model-id" };
  }
  async moderate(_req: unknown) {
    return { flagged: false, results: [], id: "mod-1", model: "resolved-model-id" };
  }
  async embed(req: { model?: string }) {
    return { vectors: [], model: req.model ?? "default-model", dimensions: 0, input_tokens: 10 };
  }
  async listModels() {
    return [];
  }
}

describe("Model Alias Resolution", () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();

    // Spy on methods
    vi.spyOn(provider, "paint");
    vi.spyOn(provider, "transcribe");
    vi.spyOn(provider, "moderate");
    vi.spyOn(provider, "embed");

    providerRegistry.register("fake", () => provider);
  });

  it("resolves alias in paint()", async () => {
    const llm = createLLM({ provider: "fake" });
    await llm.paint("prompt", { model: "test-alias" });

    expect(provider.paint).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "resolved-model-id"
      })
    );
  });

  it("resolves alias in transcribe()", async () => {
    const llm = createLLM({ provider: "fake" });
    await llm.transcribe("file.mp3", { model: "test-alias" });

    expect(provider.transcribe).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "resolved-model-id"
      })
    );
  });

  it("resolves alias in moderate()", async () => {
    const llm = createLLM({ provider: "fake" });
    await llm.moderate("text", { model: "test-alias" });

    expect(provider.moderate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "resolved-model-id"
      })
    );
  });

  it("resolves alias in embed()", async () => {
    const llm = createLLM({ provider: "fake" });
    await llm.embed("text", { model: "test-alias" });

    expect(provider.embed).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "resolved-model-id"
      })
    );
  });
});

describe("Real-world Alias Examples", () => {
  let openaiProvider: MockProvider;
  let anthropicProvider: MockProvider;

  beforeEach(() => {
    openaiProvider = new MockProvider();
    openaiProvider.id = "openai";

    anthropicProvider = new MockProvider();
    anthropicProvider.id = "anthropic";

    vi.spyOn(openaiProvider, "paint");
    vi.spyOn(anthropicProvider, "transcribe");

    providerRegistry.register("openai", () => openaiProvider);
    providerRegistry.register("anthropic", () => anthropicProvider);
  });

  it("resolves gpt-4o for openai provider", async () => {
    const llm = createLLM({ provider: "openai" });
    await llm.paint("image prompt", { model: "gpt-4o" });

    expect(openaiProvider.paint).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o"
      })
    );
  });

  it("resolves claude-3-5-sonnet for anthropic provider", async () => {
    const llm = createLLM({ provider: "anthropic" });
    // Using transcribe as a generic method call for testing
    await llm.transcribe("audio.mp3", { model: "claude-3-5-sonnet" });

    expect(anthropicProvider.transcribe).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-3-5-sonnet-20241022"
      })
    );
  });
});
