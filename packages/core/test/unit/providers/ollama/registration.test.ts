import { describe, it, expect } from "vitest";
import { registerOllamaProvider } from "../../../../src/providers/ollama/index.js";
import { providerRegistry } from "../../../../src/providers/registry.js";
import { OpenAIProvider } from "../../../../src/providers/openai/OpenAIProvider.js";

describe("Ollama Provider Registration", () => {
  it("registers the ollama provider and resolves to OpenAIProvider", () => {
    registerOllamaProvider();
    const provider = providerRegistry.resolve("ollama");
    expect(provider).toBeDefined();
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it("configures the provider with default endpoint", () => {
    const provider = providerRegistry.resolve("ollama") as unknown as {
      baseUrl: string;
      chatHandler: { apiKey: string };
    };
    expect(provider.baseUrl).toBe("http://localhost:11434/v1");
    expect(provider.chatHandler.apiKey).toBe("ollama");
  });
});
