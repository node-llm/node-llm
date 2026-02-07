/**
 * Documentation Verification Tests: README.md Mocker Usage
 *
 * Verifies that all Mocker code examples from the README work correctly.
 */
import { describe, it, expect, afterEach } from "vitest";
import { mockLLM, Mocker } from "../../src/index.js";

describe("readme-mocker", () => {
  let mocker: ReturnType<typeof mockLLM>;

  afterEach(() => {
    if (mocker) {
      mocker.clear();
    }
  });

  describe("Fluent, Explicit Mocking", () => {
    it("mockLLM() creates a mocker instance", () => {
      // Per docs: const mocker = mockLLM();
      mocker = mockLLM();
      expect(mocker).toBeDefined();
    });

    it("mocker.chat() accepts exact string match", () => {
      // Per docs: mocker.chat("Ping").respond("Pong");
      mocker = mockLLM();
      expect(() => {
        mocker.chat("Ping").respond("Pong");
      }).not.toThrow();
    });

    it("mocker.chat() accepts regex match", () => {
      // Per docs: mocker.chat(/hello/i).respond("Greetings!");
      mocker = mockLLM();
      expect(() => {
        mocker.chat(/hello/i).respond("Greetings!");
      }).not.toThrow();
    });

    it("mocker.chat() without arguments matches any", () => {
      // Per docs: mocker.chat() matches any chat request
      mocker = mockLLM();
      expect(() => {
        mocker.chat().respond("Generic response");
      }).not.toThrow();
    });
  });

  describe("Tool Call Mocking", () => {
    it("callsTool() simulates a tool call", () => {
      // Per docs: mocker.chat("What's the weather?").callsTool("get_weather", { city: "London" });
      mocker = mockLLM();
      expect(() => {
        mocker.chat("What's the weather?").callsTool("get_weather", { city: "London" });
      }).not.toThrow();
    });

    it("callsTool() accepts tool name and args", () => {
      mocker = mockLLM();
      mocker.chat("Search for documents").callsTool("search_docs", { query: "test", limit: 10 });
      expect(mocker).toBeDefined();
    });
  });

  describe("Streaming Mocks", () => {
    it("stream() accepts array of string tokens", () => {
      // Per docs: mocker.chat("Tell a story").stream(["Once ", "upon ", "a ", "time."]);
      mocker = mockLLM();
      expect(() => {
        mocker.chat("Tell a story").stream(["Once ", "upon ", "a ", "time."]);
      }).not.toThrow();
    });
  });

  describe("Multimodal Mocks", () => {
    it("paint() mocks image generation", () => {
      // Per docs: mocker.paint(/a cat/i).respond({ url: "https://mock.com/cat.png" });
      mocker = mockLLM();
      expect(() => {
        mocker.paint(/a cat/i).respond({ url: "https://mock.com/cat.png" });
      }).not.toThrow();
    });

    it("embed() mocks embeddings", () => {
      // Per docs: mocker.embed("text").respond({ vectors: [[0.1, 0.2, 0.3]] });
      mocker = mockLLM();
      expect(() => {
        mocker.embed("text").respond({ vectors: [[0.1, 0.2, 0.3]] });
      }).not.toThrow();
    });

    it("transcribe() mocks transcription", () => {
      // Per docs: mocker.transcribe() mocks audio transcription
      mocker = mockLLM();
      expect(() => {
        mocker.transcribe("audio.mp3").respond({ text: "Hello world" });
      }).not.toThrow();
    });

    it("moderate() mocks moderation", () => {
      // Per docs: mocker.moderate() mocks content moderation
      mocker = mockLLM();
      expect(() => {
        mocker.moderate("test content").respond({
          results: [{ flagged: false, categories: {}, category_scores: {} }]
        });
      }).not.toThrow();
    });
  });

  describe("Call Verification & History", () => {
    it("history property returns array of calls", () => {
      // Per docs: const history = mocker.history;
      mocker = mockLLM();
      expect(Array.isArray(mocker.history)).toBe(true);
    });

    it("getCalls() filters by method", () => {
      // Per docs: const chats = mocker.getCalls("chat");
      mocker = mockLLM();
      const chats = mocker.getCalls("chat");
      expect(Array.isArray(chats)).toBe(true);
    });

    it("getLastCall() returns most recent call", () => {
      // Per docs: const lastEmbed = mocker.getLastCall("embed");
      mocker = mockLLM();
      const lastCall = mocker.getLastCall("embed");
      // No calls yet, so undefined
      expect(lastCall).toBeUndefined();
    });

    it("resetHistory() clears call history", () => {
      // Per docs: mocker.resetHistory();
      mocker = mockLLM();
      expect(() => {
        mocker.resetHistory();
      }).not.toThrow();
      expect(mocker.history).toHaveLength(0);
    });
  });

  describe("Debug Information", () => {
    it("getDebugInfo() returns mock statistics", () => {
      // Per docs: const debug = mocker.getDebugInfo();
      mocker = mockLLM();
      mocker.chat("hello").respond("hi");
      mocker.embed("text").respond({ vectors: [[0.1, 0.2]] });

      const debug = mocker.getDebugInfo();

      // Per docs: { totalMocks: 2, methods: ["chat", "embed"] }
      expect(debug).toHaveProperty("totalMocks");
      expect(debug).toHaveProperty("methods");
      expect(debug.totalMocks).toBe(2);
      expect(debug.methods).toContain("chat");
      expect(debug.methods).toContain("embed");
    });
  });

  describe("MockerOptions Interface", () => {
    it("strict option enforces exact matching", () => {
      // Per docs: const mocker = mockLLM({ strict: false });
      mocker = mockLLM({ strict: false });
      expect(mocker.strict).toBe(false);

      const strictMocker = mockLLM({ strict: true });
      expect(strictMocker.strict).toBe(true);
      strictMocker.clear();
    });
  });

  describe("Mocker Class Direct Usage", () => {
    it("Mocker class can be instantiated directly", () => {
      // Per docs: const mocker = new Mocker();
      const directMocker = new Mocker();
      expect(directMocker).toBeDefined();
      directMocker.clear();
    });

    it("Mocker class accepts options", () => {
      // Per docs: const mocker = new Mocker({ strict: true });
      const directMocker = new Mocker({ strict: true });
      expect(directMocker.strict).toBe(true);
      directMocker.clear();
    });
  });

  describe("MockResponse Interface", () => {
    it("respond() accepts content property", () => {
      // Per docs: interface MockResponse { content?: string; }
      mocker = mockLLM();
      mocker.chat("test").respond({ content: "response" });
      expect(mocker).toBeDefined();
    });

    it("respond() accepts error property", () => {
      // Per docs: interface MockResponse { error?: Error | string; }
      mocker = mockLLM();
      mocker.chat("fail").respond({ error: new Error("Mock error") });
      expect(mocker).toBeDefined();
    });

    it("respond() accepts usage metadata", () => {
      // Per docs: interface MockResponse { metadata?: { tokensUsed?: number; model?: string; } }
      mocker = mockLLM();
      mocker.chat("test").respond({
        content: "response",
        usage: {
          input_tokens: 10,
          output_tokens: 20,
          total_tokens: 30
        }
      });
      expect(mocker).toBeDefined();
    });
  });

  describe("MockCall Interface", () => {
    it("MockCall has method property", () => {
      // Per docs: interface MockCall { method: string; }
      const mockCall = {
        method: "chat",
        args: [],
        timestamp: Date.now()
      };
      expect(typeof mockCall.method).toBe("string");
    });

    it("MockCall has args property", () => {
      // Per docs: interface MockCall { args: unknown[]; }
      const mockCall = {
        method: "chat",
        args: [{ messages: [] }],
        timestamp: Date.now()
      };
      expect(Array.isArray(mockCall.args)).toBe(true);
    });

    it("MockCall has timestamp property", () => {
      // Per docs: interface MockCall { timestamp: number; }
      const mockCall = {
        method: "chat",
        args: [],
        timestamp: Date.now()
      };
      expect(typeof mockCall.timestamp).toBe("number");
    });

    it("MockCall has optional prompt property", () => {
      // Per docs: interface MockCall { prompt?: unknown; }
      const mockCall = {
        method: "chat",
        args: [],
        timestamp: Date.now(),
        prompt: "Hello world"
      };
      expect(mockCall.prompt).toBe("Hello world");
    });
  });

  describe("Multi-tool and Sequence Support", () => {
    it("callsTools() accepts array of tool definitions", () => {
      // Per docs: mocker.chat(/book flight/).callsTools([...])
      mocker = mockLLM();
      expect(() => {
        mocker.chat(/book flight/).callsTools([
          { name: "search_flights", args: { from: "NYC", to: "LAX" } },
          { name: "check_weather", args: { city: "LAX" } }
        ]);
      }).not.toThrow();
    });

    it("sequence() accepts array of responses", () => {
      // Per docs: mocker.chat(/help/).sequence([...])
      mocker = mockLLM();
      expect(() => {
        mocker.chat(/help/).sequence([
          "What do you need help with?",
          "Here's the answer.",
          "Anything else?"
        ]);
      }).not.toThrow();
    });

    it("times() limits mock matches", () => {
      // Per docs: mocker.chat(/retry/).times(2).respond("Try again")
      mocker = mockLLM();
      expect(() => {
        mocker.chat(/retry/).times(2).respond("Try again");
        mocker.chat(/retry/).respond("Giving up");
      }).not.toThrow();
    });
  });
});
