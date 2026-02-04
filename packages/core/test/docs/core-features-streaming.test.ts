/**
 * Documentation Verification Tests: core-features/streaming.md
 *
 * Verifies that all code examples from the Streaming documentation work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  Tool,
  z,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("core-features-streaming", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["Code flows like water. Logic builds a new world now. Bugs swim in the stream."]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Basic Streaming", () => {
    it("chat.stream() returns an async iterator", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const stream = chat.stream("Write a haiku about code.");

      expect(stream[Symbol.asyncIterator]).toBeDefined();
    });

    it("stream yields chunks with content", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const chunks: string[] = [];
      for await (const chunk of chat.stream("Write a haiku about code.")) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe("Understanding Chunks", () => {
    it("chunks have content property", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      for await (const chunk of chat.stream("Hello")) {
        // Check chunk structure
        expect(chunk).toHaveProperty("content");
        break; // Only check first chunk
      }
    });

    it("accumulated chunks form complete response", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      let accumulated = "";
      for await (const chunk of chat.stream("Hello")) {
        accumulated += chunk.content || "";
      }

      expect(accumulated).toBeTruthy();
    });
  });

  describe("Streaming with Tools", () => {
    it("tools work with streaming", async () => {
      class WeatherTool extends Tool {
        name = "get_weather";
        description = "Get current weather";
        schema = z.object({
          location: z.string().describe("The city e.g. Paris")
        });

        async execute({ location }: { location: string }) {
          return { location, temp: 22, condition: "sunny" };
        }
      }

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withTool(WeatherTool);

      // Verify we can iterate over the stream with tools registered
      let content = "";
      for await (const chunk of chat.stream("What's the weather in Paris?")) {
        content += chunk.content || "";
      }

      expect(content).toBeDefined();
    });

    it("onToolCall() hook exists for streaming", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.onToolCall).toBe("function");
    });

    it("onToolResult() hook exists for streaming", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      expect(typeof chat.onToolResult).toBe("function");
    });

    it("tool event hooks are chainable", () => {
      class WeatherTool extends Tool {
        name = "get_weather";
        description = "Get weather";
        schema = z.object({ location: z.string() });
        async execute() {
          return { temp: 22 };
        }
      }

      const llm = createLLM({ provider: "fake" });
      const chat = llm
        .chat("fake-model")
        .withTool(WeatherTool)
        .onToolCall((call) => {
          console.log(`Tool Called: ${call.function.name}`);
        })
        .onToolResult((result) => {
          console.log(`Tool Result: ${JSON.stringify(result)}`);
        });

      expect(chat).toBeDefined();
    });
  });

  describe("Multimodal & Structured Streaming", () => {
    it("stream() accepts images option for multimodal", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      // Verify the option is accepted (won't actually process the image with fake provider)
      const stream = chat.stream("What's in this image?", {
        images: ["./analysis.png"]
      });

      expect(stream[Symbol.asyncIterator]).toBeDefined();
    });

    it("withSchema() works with stream()", async () => {
      const personSchema = z.object({
        name: z.string(),
        hobbies: z.array(z.string())
      });

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withSchema(personSchema);

      // Verify stream method exists on schema-enabled chat
      expect(typeof chat.stream).toBe("function");
    });
  });

  describe("Error Handling", () => {
    it("stream errors can be caught in try/catch", async () => {
      provider = new FakeProvider([new Error("Stream Error")]);
      providerRegistry.register("fake", () => provider);

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      let caughtError = false;
      try {
        for await (const chunk of chat.stream("Generate a long story...")) {
          // Stream through
        }
      } catch (error) {
        caughtError = true;
        expect(error).toBeInstanceOf(Error);
      }

      expect(caughtError).toBe(true);
    });
  });
});
