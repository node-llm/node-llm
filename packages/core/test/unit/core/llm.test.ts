import { describe, it, expect } from "vitest";
import { NodeLLM } from "../../../src/llm.js";
import { providerRegistry } from "../../../src/providers/registry.js";
import { FakeProvider } from "../../fake-provider.js";

describe("NodeLLM.configure", () => {
  it("resolves provider by name using registry", async () => {
    providerRegistry.register("fake", () => {
      return new FakeProvider(["fake reply"]);
    });

    NodeLLM.configure({ provider: "fake" });

    const chat = NodeLLM.chat("test-model");
    const reply = await chat.ask("Hello");

    expect(String(reply)).toBe("fake reply");
  });

  it("throws error when provider is not configured", () => {
    const freshLLM = new (NodeLLM.constructor as any)();

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
    supportsReasoning: (_m: string) => false,
    getContextWindow: (_m: string) => 0
  } as any;

  async paint(_req: any): Promise<any> { return { url: "ok" }; }
  async transcribe(_req: any): Promise<any> { return { text: "ok" }; }
  async embed(_req: any): Promise<any> { return { vectors: [[0.1]], model: "test", dimensions: 1 }; }
  async moderate(_req: any): Promise<any> { return { flagged: false }; }
}

describe("NodeLLM assumeModelExists", () => {
  it("bypasses capability checks when assumeModelExists is true", async () => {
    const provider = new MockCapabilitiesProvider();
    NodeLLM.configure({ provider });

    // 1. Image Generation (paint)
    // Should fail without flag
    await expect(NodeLLM.paint("test", { model: "unsupported-model" }))
      .rejects.toThrow("does not support image generation");

    // Should succeed with flag
    await expect(NodeLLM.paint("test", { model: "unsupported-model", assumeModelExists: true }))
      .resolves.toBeDefined();

    // 2. Transcription
    // Should fail without flag
    await expect(NodeLLM.transcribe("audio.mp3", { model: "unsupported-model" }))
      .rejects.toThrow("does not support transcription");
      
    // Should succeed with flag
    await expect(NodeLLM.transcribe("audio.mp3", { model: "unsupported-model", assumeModelExists: true }))
      .resolves.toBeDefined();

    // 3. Embeddings
    await expect(NodeLLM.embed("text", { model: "unsupported-model" }))
      .rejects.toThrow("does not support embeddings");

    await expect(NodeLLM.embed("text", { model: "unsupported-model", assumeModelExists: true }))
      .resolves.toBeDefined();
      
    // 4. Moderation
    await expect(NodeLLM.moderate("text", { model: "unsupported-model" }))
      .rejects.toThrow("does not support moderation");

    await expect(NodeLLM.moderate("text", { model: "unsupported-model", assumeModelExists: true }))
      .resolves.toBeDefined();
  });
});
