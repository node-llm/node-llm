import { describe, it, expect } from "vitest";
import { LLM } from "../../../src/llm.js";
import { providerRegistry } from "../../../src/providers/registry.js";
import { FakeProvider } from "../../fake-provider.js";

describe("LLM.configure", () => {
  it("resolves provider by name using registry", async () => {
    providerRegistry.register("fake", () => {
      return new FakeProvider(["fake reply"]);
    });

    LLM.configure({ provider: "fake" });

    const chat = LLM.chat("test-model");
    const reply = await chat.ask("Hello");

    expect(String(reply)).toBe("fake reply");
  });

  it("throws error when provider is not configured", () => {
    const freshLLM = new (LLM.constructor as any)();

    expect(() => {
      freshLLM.chat("test-model");
    }).toThrow("LLM provider not configured");
  });
});

class MockCapabilitiesProvider extends FakeProvider {
  // Explicitly deny support for everything
  capabilities = {
    supportsVision: (_m: string) => false,
    supportsTools: (_m: string) => false,
    supportsStructuredOutput: (_m: string) => false,
    supportsEmbeddings: (_m: string) => false,
    supportsImageGeneration: (_m: string) => false,
    supportsTranscription: (_m: string) => false,
    supportsModeration: (_m: string) => false,
    getContextWindow: (_m: string) => 0
  } as any;

  async paint(_req: any): Promise<any> { return { url: "ok" }; }
  async transcribe(_req: any): Promise<any> { return { text: "ok" }; }
  async embed(_req: any): Promise<any> { return { vectors: [[0.1]], model: "test", dimensions: 1 }; }
  async moderate(_req: any): Promise<any> { return { flagged: false }; }
}

describe("LLM assumeModelExists", () => {
  it("bypasses capability checks when assumeModelExists is true", async () => {
    const provider = new MockCapabilitiesProvider();
    LLM.configure({ provider });

    // 1. Image Generation (paint)
    // Should fail without flag
    await expect(LLM.paint("test", { model: "unsupported-model" }))
      .rejects.toThrow("does not support image generation");

    // Should succeed with flag
    await expect(LLM.paint("test", { model: "unsupported-model", assumeModelExists: true }))
      .resolves.toBeDefined();

    // 2. Transcription
    // Should fail without flag
    await expect(LLM.transcribe("audio.mp3", { model: "unsupported-model" }))
      .rejects.toThrow("does not support transcription");
      
    // Should succeed with flag
    await expect(LLM.transcribe("audio.mp3", { model: "unsupported-model", assumeModelExists: true }))
      .resolves.toBeDefined();

    // 3. Embeddings
    await expect(LLM.embed("text", { model: "unsupported-model" }))
      .rejects.toThrow("does not support embeddings");

    await expect(LLM.embed("text", { model: "unsupported-model", assumeModelExists: true }))
      .resolves.toBeDefined();
      
    // 4. Moderation
    await expect(LLM.moderate("text", { model: "unsupported-model" }))
      .rejects.toThrow("does not support moderation");

    await expect(LLM.moderate("text", { model: "unsupported-model", assumeModelExists: true }))
      .resolves.toBeDefined();
  });
});
