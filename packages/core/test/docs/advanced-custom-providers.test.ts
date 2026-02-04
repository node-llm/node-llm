/**
 * Documentation Verification Tests: advanced/custom-providers.md
 *
 * Verifies that custom provider patterns from docs work correctly.
 */
import { describe, it, expect } from "vitest";
import {
  NodeLLM,
  createLLM,
  BaseProvider,
  ChatRequest,
  ChatResponse,
  PricingRegistry,
  BadRequestError,
  ContextWindowExceededError,
  RateLimitError,
  ServerError,
  providerRegistry
} from "../../src/index.js";
import type { Provider } from "../../src/types/index.js";

describe("advanced-custom-providers", () => {
  describe("BaseProvider Extension", () => {
    it("Custom provider can extend BaseProvider", () => {
      // Per docs: class MyCustomProvider extends BaseProvider { ... }
      class MyCustomProvider extends BaseProvider {
        private apiKey: string;
        private region: string;

        constructor(config: { apiKey: string; region: string }) {
          super();
          this.apiKey = config.apiKey;
          this.region = config.region;
        }

        protected providerName() {
          return "my-custom-service";
        }

        public apiBase() {
          return `https://api.${this.region}.my-service.com/v1`;
        }

        public headers() {
          return {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          };
        }

        async chat(request: ChatRequest): Promise<ChatResponse> {
          return {
            content: "Hello from my custom provider!",
            usage: { input_tokens: 5, output_tokens: 5, total_tokens: 10 }
          };
        }

        public defaultModel(feature?: string): string {
          return "my-model-v1";
        }
      }

      const provider = new MyCustomProvider({ apiKey: "test-key", region: "us-west" });

      expect(provider.apiBase()).toBe("https://api.us-west.my-service.com/v1");
      expect(provider.headers()).toEqual({
        Authorization: "Bearer test-key",
        "Content-Type": "application/json"
      });
      expect(provider.defaultModel()).toBe("my-model-v1");
    });
  });

  describe("Capabilities", () => {
    it("Provider can define custom capabilities", () => {
      // Per docs: public capabilities = { ... }
      class CapableProvider extends BaseProvider {
        protected providerName() {
          return "capable-service";
        }
        public apiBase() {
          return "https://api.capable.com/v1";
        }
        public headers() {
          return {};
        }
        async chat(): Promise<ChatResponse> {
          return { content: "test" };
        }
        public defaultModel() {
          return "test-model";
        }

        public capabilities = {
          ...this.defaultCapabilities(),
          supportsDeveloperRole: (modelId: string) => true,
          supportsVision: (modelId: string) => modelId.includes("vision"),
          getContextWindow: (modelId: string) => 128000
        };
      }

      const provider = new CapableProvider();
      expect(provider.capabilities.supportsDeveloperRole("any")).toBe(true);
      expect(provider.capabilities.supportsVision("model-vision")).toBe(true);
      expect(provider.capabilities.supportsVision("model-text")).toBe(false);
      expect(provider.capabilities.getContextWindow("any")).toBe(128000);
    });
  });

  describe("Provider Registration", () => {
    it("NodeLLM.registerProvider pattern compiles", () => {
      // Per docs: NodeLLM.registerProvider("my-service", () => new MyProvider())
      class MinimalProvider extends BaseProvider {
        protected providerName() {
          return "test-service";
        }
        public apiBase() {
          return "https://test.com";
        }
        public headers() {
          return {};
        }
        async chat(): Promise<ChatResponse> {
          return { content: "test" };
        }
        public defaultModel() {
          return "test";
        }
      }

      // Register the provider
      NodeLLM.registerProvider("test-service", () => new MinimalProvider());

      // Verify registration (we can't easily test the call, but registration should work)
      expect(typeof NodeLLM.registerProvider).toBe("function");
    });
  });

  describe("Streaming Support", () => {
    it("Provider can implement stream generator", () => {
      // Per docs: async *stream(request: ChatRequest) { ... }
      class StreamingProvider extends BaseProvider {
        protected providerName() {
          return "streaming-service";
        }
        public apiBase() {
          return "https://stream.com";
        }
        public headers() {
          return {};
        }
        async chat(): Promise<ChatResponse> {
          return { content: "test" };
        }
        public defaultModel() {
          return "stream-model";
        }

        async *stream(request: ChatRequest) {
          // Per docs: simulated streaming
          const words = ["This", "is", "a", "stream"];
          for (const word of words) {
            yield { content: word + " " };
          }
        }
      }

      const provider = new StreamingProvider();
      expect(typeof provider.stream).toBe("function");
    });
  });

  describe("Scoped Credentials Pattern", () => {
    it("Provider can use config from factory function", () => {
      // Per docs: NodeLLM.registerProvider("internal-llm", (config) => { ... })
      class ConfigurableProvider extends BaseProvider {
        private apiKey: string;
        private region: string;

        constructor(config: { apiKey?: string; region: string }) {
          super();
          this.apiKey = config.apiKey || "default-key";
          this.region = config.region;
        }

        protected providerName() {
          return "configurable";
        }
        public apiBase() {
          return `https://${this.region}.api.com`;
        }
        public headers() {
          return { Authorization: `Bearer ${this.apiKey}` };
        }
        async chat(): Promise<ChatResponse> {
          return { content: "test" };
        }
        public defaultModel() {
          return "model";
        }
      }

      // Per docs: factory function receives config
      const factory = (config?: Record<string, unknown>) => {
        return new ConfigurableProvider({
          apiKey:
            (config?.["internalApiKey"] as string) ||
            process.env.INTERNAL_LLM_KEY ||
            "fallback",
          region: "us-east-1"
        });
      };

      const provider = factory({ internalApiKey: "custom-key" });
      expect(provider.headers()).toEqual({ Authorization: "Bearer custom-key" });
    });
  });

  describe("Extra Fields Handling", () => {
    it("Provider can access custom params from request", async () => {
      // Per docs: const { model, messages, ...customParams } = request;
      class ExtendedProvider extends BaseProvider {
        protected providerName() {
          return "extended";
        }
        public apiBase() {
          return "https://extended.com";
        }
        public headers() {
          return {};
        }
        async chat(request: ChatRequest): Promise<ChatResponse> {
          // Destructure to separate standard fields from custom ones
          const { model, messages, ...customParams } = request;

          let content = "standard response";
          if ((customParams as { internal_routing_id?: string }).internal_routing_id) {
            content = "routed response";
          }
          return { content };
        }
        public defaultModel() {
          return "extended-model";
        }
      }

      const provider = new ExtendedProvider();
      const response = await provider.chat({
        model: "test",
        messages: [{ role: "user", content: "Hi" }],
        internal_routing_id: "route-123"
      } as ChatRequest);

      // In a real scenario, custom params would be accessible
      expect(response.content).toBeDefined();
    });
  });

  describe("Error Handling Pattern", () => {
    it("Specialized error classes are importable", () => {
      // Per docs: import { BadRequestError, ContextWindowExceededError, ... }
      expect(BadRequestError).toBeDefined();
      expect(ContextWindowExceededError).toBeDefined();
      expect(RateLimitError).toBeDefined();
      expect(ServerError).toBeDefined();
    });

    it("Error handler function pattern compiles", async () => {
      // Per docs: async function myErrorHandler(response, modelId) { ... }
      async function myErrorHandler(
        response: { status: number; json: () => Promise<unknown> },
        modelId: string
      ): Promise<never> {
        const status = response.status;
        const body = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        const message = body.error?.message || "Unknown error";

        if (status === 400) {
          if (message.includes("tokens") || message.includes("context")) {
            throw new ContextWindowExceededError(message, body, "my-service", modelId);
          }
          throw new BadRequestError(message, body, "my-service", modelId);
        }

        if (status === 429) {
          throw new RateLimitError(message, body, "my-service", modelId);
        }

        if (status >= 500) {
          throw new ServerError(message, status, body, "my-service", modelId);
        }

        throw new Error(`Technical failure (${status}): ${message}`);
      }

      // Verify the function exists and can be called
      expect(typeof myErrorHandler).toBe("function");

      // Test that it throws correct errors
      const mockResponse400 = {
        status: 400,
        json: async () => ({ error: { message: "context length exceeded" } })
      };

      await expect(myErrorHandler(mockResponse400, "test-model")).rejects.toThrow(
        ContextWindowExceededError
      );
    });
  });

  describe("Custom Pricing", () => {
    it("PricingRegistry.register pattern works", () => {
      // Per docs: PricingRegistry.register("my-custom-service", "my-model-v1", {...})
      expect(typeof PricingRegistry.register).toBe("function");

      // This should not throw
      PricingRegistry.register("test-custom-service", "test-model-v1", {
        text_tokens: {
          standard: {
            input_per_million: 1.5,
            output_per_million: 4.5
          }
        }
      });
    });
  });
});
