/**
 * README Code Examples Verification
 *
 * Tests that code patterns shown in README.md actually work.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect } from "vitest";
import { createLLM, NodeLLM, z, Tool, providerRegistry } from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

// Register fake provider for tests
providerRegistry.register("fake", () => new FakeProvider(["test response"]));

describe("readme", () => {
  describe("Quick Start Examples", () => {
    it("createLLM() creates an LLM instance", () => {
      const llm = createLLM({ provider: "fake" });
      expect(llm).toBeDefined();
      expect(typeof llm.chat).toBe("function");
    });

    it("llm.chat() accepts model parameter", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("test-model");
      expect(chat).toBeDefined();
      expect(typeof chat.ask).toBe("function");
      expect(typeof chat.stream).toBe("function");
    });
  });

  describe("Structured Output Examples", () => {
    it("z.object() creates a schema", () => {
      const PlayerSchema = z.object({
        name: z.string(),
        powerLevel: z.number(),
        abilities: z.array(z.string())
      });

      expect(PlayerSchema).toBeDefined();
      expect(typeof PlayerSchema.parse).toBe("function");
    });

    it("chat.withSchema() accepts zod schema", () => {
      const llm = createLLM({ provider: "fake" });
      const schema = z.object({ name: z.string() });
      const chat = llm.chat("test-model").withSchema(schema);

      expect(chat).toBeDefined();
      expect(typeof chat.ask).toBe("function");
    });
  });

  describe("Security Circuit Breakers", () => {
    it("createLLM accepts security options", () => {
      const llm = createLLM({
        provider: "fake",
        requestTimeout: 15000,
        maxTokens: 4096,
        maxRetries: 3,
        maxToolCalls: 5
      });

      expect(llm).toBeDefined();
    });
  });

  describe("Tool System Examples", () => {
    it("Tool class can be extended", () => {
      class WeatherTool extends Tool {
        name = "get_weather";
        description = "Get current weather";
        schema = z.object({ location: z.string() });

        async execute({ location }: { location: string }) {
          return `Sunny in ${location}`;
        }
      }

      const tool = new WeatherTool();
      expect(tool.name).toBe("get_weather");
      expect(tool.description).toBe("Get current weather");
      expect(tool.schema).toBeDefined();
    });

    it("chat.withTool() accepts Tool class", () => {
      class TestTool extends Tool {
        name = "test_tool";
        description = "Test tool";
        schema = z.object({ input: z.string() });
        async execute() {
          return "result";
        }
      }

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("test-model").withTool(TestTool);
      expect(chat).toBeDefined();
    });

    it("tool lifecycle hooks exist", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("test-model");

      expect(typeof chat.onToolCallError).toBe("function");
      expect(typeof chat.onToolCallStart).toBe("function");
      expect(typeof chat.onToolCallEnd).toBe("function");
    });
  });

  describe("Provider Configuration", () => {
    it("createLLM accepts multiple provider keys", () => {
      const llm = createLLM({
        provider: "fake",
        openaiApiKey: "test-openai-key",
        anthropicApiKey: "test-anthropic-key",
        ollamaApiBase: "http://localhost:11434"
      });

      expect(llm).toBeDefined();
    });

    it("createLLM accepts custom endpoint", () => {
      const llm = createLLM({
        provider: "fake",
        openaiApiKey: "test-key",
        openaiApiBase: "https://custom-endpoint.example.com"
      });

      expect(llm).toBeDefined();
    });
  });

  describe("Chat Methods", () => {
    it("chat has ask method", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("test-model");
      expect(typeof chat.ask).toBe("function");
    });

    it("chat has stream method", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("test-model");
      expect(typeof chat.stream).toBe("function");
    });
  });

  describe("Static Methods", () => {
    it("NodeLLM.paint exists for image generation", () => {
      expect(typeof NodeLLM.paint).toBe("function");
    });

    it("NodeLLM.transcribe exists for audio", () => {
      expect(typeof NodeLLM.transcribe).toBe("function");
    });

    it("NodeLLM.embed exists for embeddings", () => {
      expect(typeof NodeLLM.embed).toBe("function");
    });
  });
});
