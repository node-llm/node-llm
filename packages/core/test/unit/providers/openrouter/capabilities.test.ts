import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenRouterCapabilities } from "../../../../src/providers/openrouter/Capabilities.js";
import { ModelRegistry } from "../../../../src/models/ModelRegistry.js";

// Mock ModelRegistry.find
vi.mock("../../../../src/models/ModelRegistry.js", () => ({
  ModelRegistry: {
    find: vi.fn()
  }
}));

describe("OpenRouterCapabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("supportsVision", () => {
    it("returns true if model has vision capability in registry", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue({
        id: "gpt-4-vision",
        name: "GPT-4 Vision",
        provider: "openai",
        capabilities: ["vision"],
        modalities: { input: ["text", "image"], output: ["text"] },
        context_window: 128000
      } as ReturnType<typeof ModelRegistry.find>);

      expect(OpenRouterCapabilities.supportsVision("gpt-4-vision")).toBe(true);
    });

    it("returns true if model has image input modality", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue({
        id: "test-model",
        name: "Test Model",
        provider: "openai",
        capabilities: [],
        modalities: { input: ["image"], output: ["text"] },
        context_window: 8000
      } as ReturnType<typeof ModelRegistry.find>);

      expect(OpenRouterCapabilities.supportsVision("test-model")).toBe(true);
    });

    it("uses fallback heuristics when model not in registry", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue(undefined);

      // Test various vision model patterns
      expect(OpenRouterCapabilities.supportsVision("some-vision-model")).toBe(true);
      expect(OpenRouterCapabilities.supportsVision("gpt-4o")).toBe(true);
      expect(OpenRouterCapabilities.supportsVision("claude-3-opus")).toBe(true);
      expect(OpenRouterCapabilities.supportsVision("gemini-1.5-pro")).toBe(true);
      expect(OpenRouterCapabilities.supportsVision("gemini-2.0-flash")).toBe(true);
      expect(OpenRouterCapabilities.supportsVision("flash-model")).toBe(true);
      expect(OpenRouterCapabilities.supportsVision("gemini-pro-vision")).toBe(true);
      expect(OpenRouterCapabilities.supportsVision("unknown-text-model")).toBe(false);
    });
  });

  describe("supportsTools", () => {
    it("returns true if model has tools capability", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue({
        id: "gpt-4",
        name: "GPT-4",
        provider: "openai",
        capabilities: ["tools"],
        modalities: { input: ["text"], output: ["text"] },
        context_window: 8000
      } as ReturnType<typeof ModelRegistry.find>);

      expect(OpenRouterCapabilities.supportsTools("gpt-4")).toBe(true);
    });

    it("returns true if model has function_calling capability", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue({
        id: "claude-3",
        name: "Claude 3",
        provider: "anthropic",
        capabilities: ["function_calling"],
        modalities: { input: ["text"], output: ["text"] },
        context_window: 200000
      } as ReturnType<typeof ModelRegistry.find>);

      expect(OpenRouterCapabilities.supportsTools("claude-3")).toBe(true);
    });

    it("defaults to true for unknown models (OpenRouter fallback)", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue(undefined);
      expect(OpenRouterCapabilities.supportsTools("unknown-model")).toBe(true);
    });
  });

  describe("supportsStructuredOutput", () => {
    it("returns true if model has structured_output capability", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue({
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        provider: "openai",
        capabilities: ["structured_output"],
        modalities: { input: ["text"], output: ["text"] },
        context_window: 128000
      } as ReturnType<typeof ModelRegistry.find>);

      expect(OpenRouterCapabilities.supportsStructuredOutput("gpt-4-turbo")).toBe(true);
    });

    it("returns true for gpt-4 models in registry", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue({
        id: "gpt-4-old",
        name: "GPT-4 Old",
        provider: "openai",
        capabilities: [],
        modalities: { input: ["text"], output: ["text"] },
        context_window: 8000
      } as ReturnType<typeof ModelRegistry.find>);

      expect(OpenRouterCapabilities.supportsStructuredOutput("gpt-4-old")).toBe(true);
    });

    it("uses fallback heuristics for unknown models", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue(undefined);

      expect(OpenRouterCapabilities.supportsStructuredOutput("gpt-4")).toBe(true);
      expect(OpenRouterCapabilities.supportsStructuredOutput("gpt-3.5-turbo")).toBe(true);
      expect(OpenRouterCapabilities.supportsStructuredOutput("claude-3-opus")).toBe(true);
      expect(OpenRouterCapabilities.supportsStructuredOutput("llama-2")).toBe(false);
    });
  });

  describe("supportsEmbeddings", () => {
    it("returns true if model has embeddings capability", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue({
        id: "text-embedding-3-large",
        name: "Text Embedding 3 Large",
        provider: "openai",
        capabilities: ["embeddings"],
        modalities: { input: ["text"], output: ["embeddings"] },
        context_window: 8191
      } as ReturnType<typeof ModelRegistry.find>);

      expect(OpenRouterCapabilities.supportsEmbeddings("text-embedding-3-large")).toBe(true);
    });

    it("uses fallback heuristics for unknown models", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue(undefined);

      expect(OpenRouterCapabilities.supportsEmbeddings("text-embedding-ada")).toBe(true);
      expect(OpenRouterCapabilities.supportsEmbeddings("embedding-model")).toBe(true);
      expect(OpenRouterCapabilities.supportsEmbeddings("gpt-4")).toBe(false);
    });
  });

  describe("supportsImageGeneration", () => {
    it("always returns false (OpenRouter does not support image gen)", () => {
      expect(OpenRouterCapabilities.supportsImageGeneration("dall-e-3")).toBe(false);
      expect(OpenRouterCapabilities.supportsImageGeneration("any-model")).toBe(false);
    });
  });

  describe("supportsTranscription", () => {
    it("always returns false (OpenRouter does not support transcription)", () => {
      expect(OpenRouterCapabilities.supportsTranscription("whisper-1")).toBe(false);
      expect(OpenRouterCapabilities.supportsTranscription("any-model")).toBe(false);
    });
  });

  describe("supportsModeration", () => {
    it("always returns false (OpenRouter does not support moderation)", () => {
      expect(OpenRouterCapabilities.supportsModeration("text-moderation")).toBe(false);
    });
  });

  describe("supportsReasoning", () => {
    it("returns true if model has reasoning capability", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue({
        id: "o1-preview",
        name: "O1 Preview",
        provider: "openai",
        capabilities: ["reasoning"],
        modalities: { input: ["text"], output: ["text"] },
        context_window: 128000
      } as ReturnType<typeof ModelRegistry.find>);

      expect(OpenRouterCapabilities.supportsReasoning("o1-preview")).toBe(true);
    });

    it("uses fallback heuristics for unknown reasoning models", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue(undefined);

      expect(OpenRouterCapabilities.supportsReasoning("o1-mini")).toBe(true);
      expect(OpenRouterCapabilities.supportsReasoning("o3-mini")).toBe(true);
      expect(OpenRouterCapabilities.supportsReasoning("deepseek-r1")).toBe(true);
      expect(OpenRouterCapabilities.supportsReasoning("qwq-32b")).toBe(true);
      expect(OpenRouterCapabilities.supportsReasoning("gpt-4")).toBe(false);
    });
  });

  describe("getContextWindow", () => {
    it("returns context window from registry if available", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue({
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        provider: "openai",
        capabilities: [],
        modalities: { input: ["text"], output: ["text"] },
        context_window: 128000
      } as ReturnType<typeof ModelRegistry.find>);

      expect(OpenRouterCapabilities.getContextWindow("gpt-4-turbo")).toBe(128000);
    });

    it("returns null for unknown models", () => {
      vi.mocked(ModelRegistry.find).mockReturnValue(undefined);
      expect(OpenRouterCapabilities.getContextWindow("unknown")).toBe(null);
    });
  });
});
