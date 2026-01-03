import { describe, it, expect, vi, beforeEach } from "vitest";
import { NodeLLM } from "../../../src/llm.js";
import { providerRegistry } from "../../../src/providers/registry.js";
import { FakeProvider } from "../../fake-provider.js";
import { Provider } from "../../../src/providers/Provider.js";

// Mock aliases
vi.mock("../../../src/aliases.json", () => ({
  default: {
    "test-alias": {
      "fake": "resolved-model-id"
    },
    // Real-world examples
    "gpt-4o": {
      "openai": "gpt-4o",
      "openrouter": "openai/gpt-4o"
    },
    "claude-3-5-sonnet": {
      "anthropic": "claude-3-5-sonnet-20241022",
      "bedrock": "anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  }
}));

class MockProvider extends FakeProvider implements Provider {
    id = "fake";
    capabilities = {
      supportsVision: ((m: string) => true) as any,
      supportsTools: ((m: string) => true) as any,
      supportsStructuredOutput: ((m: string) => true) as any,
      supportsEmbeddings: ((m: string) => true) as any,
      supportsImageGeneration: ((m: string) => true) as any,
      supportsTranscription: ((m: string) => true) as any,
      supportsModeration: ((m: string) => true) as any,
      getContextWindow: ((m: string) => 1000) as any
    } as any;

    async paint(req: any) { return { url: "ok", b64_json: "" }; }
    async transcribe(req: any) { return { text: "ok", segments: [], model: "resolved-model-id" }; }
    async moderate(req: any) { return { flagged: false, results: [], id: "mod-1", model: "resolved-model-id" }; }
    async embed(req: any) { return { vectors: [], model: req.model, dimensions: 0, input_tokens: 10 }; }
    async listModels() { return []; }
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
    NodeLLM.configure({ provider: "fake" });
  });

  it("resolves alias in paint()", async () => {
    await NodeLLM.paint("prompt", { model: "test-alias" });
    
    expect(provider.paint).toHaveBeenCalledWith(expect.objectContaining({
      model: "resolved-model-id"
    }));
  });

  it("resolves alias in transcribe()", async () => {
    await NodeLLM.transcribe("file.mp3", { model: "test-alias" });

    expect(provider.transcribe).toHaveBeenCalledWith(expect.objectContaining({
      model: "resolved-model-id"
    }));
  });

  it("resolves alias in moderate()", async () => {
    await NodeLLM.moderate("text", { model: "test-alias" });

    expect(provider.moderate).toHaveBeenCalledWith(expect.objectContaining({
      model: "resolved-model-id"
    }));
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
    NodeLLM.configure({ provider: "openai" });
    await NodeLLM.paint("image prompt", { model: "gpt-4o" });

    expect(openaiProvider.paint).toHaveBeenCalledWith(expect.objectContaining({
      model: "gpt-4o"
    }));
  });

  it("resolves claude-3-5-sonnet for anthropic provider", async () => {
    NodeLLM.configure({ provider: "anthropic" });
    // Using transcribe as a generic method call for testing
    await NodeLLM.transcribe("audio.mp3", { model: "claude-3-5-sonnet" });

    expect(anthropicProvider.transcribe).toHaveBeenCalledWith(expect.objectContaining({
      model: "claude-3-5-sonnet-20241022"
    }));
  });
});

  it("resolves alias in embed()", async () => {
    await NodeLLM.embed("text", { model: "test-alias" });

    expect(provider.embed).toHaveBeenCalledWith(expect.objectContaining({
      model: "resolved-model-id"
    }));
  });
});
