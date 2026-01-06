import { describe, it, expect, vi } from "vitest";
import { NodeLLM, BaseProvider } from "../../../src/index.js";
import { providerRegistry } from "../../../src/providers/registry.js";

class CustomTestProvider extends BaseProvider {
  constructor(private readonly config: { apiKey: string }) {
    super();
  }

  protected providerName() { return "custom-test"; }
  public apiBase() { return "https://api.test"; }
  public headers() { return { Authorization: `Bearer ${this.config.apiKey}` }; }
  public defaultModel() { return "test-model"; }

  async chat(request: any) {
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

    // 3. Configure and use
    NodeLLM.configure({ provider: name });
    const response = await NodeLLM.chat().ask("Ping");

    expect(response.content).toBe("Response from test-key-123");
    expect(response.provider).toBe("custom-test");
  });

  it("works with scoped withProvider for custom providers", async () => {
    const name = "scoped-custom";
    NodeLLM.registerProvider(name, () => new CustomTestProvider({ apiKey: "scoped-key" }));

    const scoped = NodeLLM.withProvider(name);
    const response = await scoped.chat().ask("Ping");

    expect(response.content).toBe("Response from scoped-key");
    expect(response.provider).toBe("custom-test");
  });

  it("BaseProvider throws UnsupportedFeatureError for unimplemented methods", async () => {
    const name = "unsupported-provider";
    NodeLLM.registerProvider(name, () => new CustomTestProvider({ apiKey: "key" }));
    
    NodeLLM.configure({ provider: name });

    // moderate() is not implemented in CustomTestProvider
    await expect(NodeLLM.moderate("test")).rejects.toThrow("custom-test does not support moderate");
  });
});
