import { describe, it, expect } from "vitest";
import { createLLM, NodeLLM, BaseProvider } from "../../../src/index.js";
import { providerRegistry } from "../../../src/providers/registry.js";

class CustomTestProvider extends BaseProvider {
  constructor(private readonly config: { apiKey: string }) {
    super();
  }

  protected providerName() {
    return "custom-test";
  }
  public apiBase() {
    return "https://api.test";
  }
  public headers() {
    return { Authorization: `Bearer ${this.config.apiKey}` };
  }
  public defaultModel() {
    return "test-model";
  }

  public capabilities = {
    supportsVision: () => false,
    supportsTools: () => false,
    supportsStructuredOutput: () => false,
    supportsEmbeddings: () => false,
    supportsImageGeneration: () => false,
    supportsTranscription: () => false,
    supportsModeration: () => false,
    supportsReasoning: () => false,
    supportsDeveloperRole: () => false,
    getContextWindow: () => 8192
  };

  async chat(_request: unknown) {
    return {
      content: `Response from ${this.config.apiKey}`,
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
    };
  }
}

describe("Custom Provider Registration", () => {
  it("registers and resolves a custom provider via NodeLLM.registerProvider", async () => {
    const name = "my-dynamic-provider";
    const apiKey = "test-key-123";

    // 1. Register
    NodeLLM.registerProvider(name, () => new CustomTestProvider({ apiKey }));

    // 2. Verify registry has it
    expect(providerRegistry.has(name)).toBe(true);

    // 3. Configure and use via createLLM
    const llm = createLLM({ provider: name });
    const response = await llm.chat().ask("Ping");

    expect(response.content).toBe("Response from test-key-123");
    expect(response.provider).toBe("custom-test");
  });

  it("works with scoped withProvider for custom providers", async () => {
    const name = "scoped-custom";
    NodeLLM.registerProvider(name, () => new CustomTestProvider({ apiKey: "scoped-key" }));

    // Use withProvider on the default instance (which creates a new one)
    const scoped = NodeLLM.withProvider(name);
    const response = await scoped.chat().ask("Ping");

    expect(response.content).toBe("Response from scoped-key");
    expect(response.provider).toBe("custom-test");
  });

  it("BaseProvider throws UnsupportedFeatureError for unimplemented methods", async () => {
    const name = "unsupported-provider";
    NodeLLM.registerProvider(name, () => new CustomTestProvider({ apiKey: "key" }));

    // Create new instance
    const llm = createLLM({ provider: name });

    // moderate() is not implemented in CustomTestProvider
    await expect(llm.moderate("test")).rejects.toThrow("custom-test does not support moderate");
  });
});
