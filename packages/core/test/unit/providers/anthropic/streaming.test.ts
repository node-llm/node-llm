import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicStreaming } from "../../../../src/providers/anthropic/Streaming.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";

describe("Anthropic Streaming", () => {
  let streaming: AnthropicStreaming;

  beforeEach(() => {
    streaming = new AnthropicStreaming("https://api.anthropic.com/v1", "test-key");
    vi.restoreAllMocks();
  });

  describe("Basic Streaming", () => {
    it("should stream text content", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: message_start\ndata: {"type":"message_start"}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text"}}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" World"}}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: message_stop\ndata: {"type":"message_stop"}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "test" }]
      };

      const chunks = [];
      for await (const chunk of streaming.execute(request)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0]!.content).toBe("Hello");
      expect(chunks[1]!.content).toBe(" World");
    });

    it("should handle temperature parameter", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode("event: message_stop\ndata: {}\n\n"),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "test" }],
        temperature: 0.7
      };

      const chunks = [];
      for await (const chunk of streaming.execute(request)) {
        chunks.push(chunk);
      }

      const fetchCall = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(fetchCall[1].body);
      expect(body.temperature).toBe(0.7);
    });
  });

  describe("Tool Calling", () => {
    it("should stream tool calls", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"call_123","name":"get_weather"}}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\\"location\\":"}}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"\\"Paris\\"}"}}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode("event: message_stop\ndata: {}\n\n"),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "What's the weather in Paris?" }],
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get weather",
              parameters: { type: "object", properties: {} }
            }
          }
        ]
      };

      const chunks = [];
      for await (const chunk of streaming.execute(request)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0]!.finish_reason).toBe("end_turn");
      expect(chunks[1]!.tool_calls).toBeDefined();
      expect(chunks[1]!.tool_calls?.[0]!.function.name).toBe("get_weather");
      expect(chunks[1]!.tool_calls?.[0]!.function.arguments).toBe('{"location":"Paris"}');
      expect(chunks[1]!.done).toBe(true);
    });

    it("should include tools in request body", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode("event: message_stop\ndata: {}\n\n"),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "test" }],
        tools: [
          {
            type: "function",
            function: {
              name: "test_tool",
              description: "A test tool",
              parameters: { type: "object", properties: { arg: { type: "string" } } }
            }
          }
        ]
      };

      const chunks = [];
      for await (const chunk of streaming.execute(request)) {
        chunks.push(chunk);
      }

      const fetchCall = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(fetchCall[1].body);
      expect(body.tools).toHaveLength(1);
      expect(body.tools[0].name).toBe("test_tool");
      expect(body.tools[0].input_schema).toEqual({
        type: "object",
        properties: { arg: { type: "string" } }
      });
    });
  });

  describe("PDF Support", () => {
    it("should add PDF beta header when PDF content is present", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode("event: message_stop\ndata: {}\n\n"),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this PDF" },
              { type: "image_url", image_url: { url: "data:application/pdf;base64,..." } }
            ]
          }
        ]
      };

      const chunks = [];
      for await (const chunk of streaming.execute(request)) {
        chunks.push(chunk);
      }

      const fetchCall = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(fetchCall[1].headers["anthropic-beta"]).toBe("pdfs-2024-09-25");
    });
  });

  describe("JSON Schema Response Format", () => {
    it("should add schema instruction to system prompt", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode("event: message_stop\ndata: {}\n\n"),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "Generate JSON" }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "test",
            schema: { type: "object", properties: { name: { type: "string" } } }
          }
        }
      };

      const chunks = [];
      for await (const chunk of streaming.execute(request)) {
        chunks.push(chunk);
      }

      const fetchCall = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(fetchCall[1].body);
      expect(body.system).toContain("CRITICAL: Respond ONLY with a valid JSON object");
      expect(body.system).toContain("Schema:");
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: { message: "Invalid API key" } })
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "test" }]
      };

      await expect(async () => {
        for await (const _ of streaming.execute(request)) {
          // Should not reach here
        }
      }).rejects.toThrow();
    });

    it("should handle missing response body", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: null
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "test" }]
      };

      await expect(async () => {
        for await (const _ of streaming.execute(request)) {
          // Should not reach here
        }
      }).rejects.toThrow("No response body for streaming");
    });

    it("should handle stream errors", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: error\ndata: {"type":"error","error":{"message":"Something went wrong"}}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "test" }]
      };

      await expect(async () => {
        for await (const _ of streaming.execute(request)) {
          // Should not reach here
        }
      }).rejects.toThrow("Stream error: Something went wrong");
    });

    it("should handle AbortController cancellation", async () => {
      const controller = new AbortController();
      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          controller.abort();
          return Promise.reject(new DOMException("Aborted", "AbortError"));
        })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "test" }]
      };

      const chunks = [];
      for await (const chunk of streaming.execute(request, controller)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(0);
    });

    it("should ignore JSON parse errors", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode("event: content_block_delta\ndata: {invalid json}\n\n"),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"valid"}}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode("event: message_stop\ndata: {}\n\n"),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "test" }]
      };

      const chunks = [];
      for await (const chunk of streaming.execute(request)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.content).toBe("valid");
    });
  });

  describe("Edge Cases", () => {
    it("should handle carriage returns in events", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: content_block_delta\r\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"test"}}\r\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode("event: message_stop\ndata: {}\n\n"),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "test" }]
      };

      const chunks = [];
      for await (const chunk of streaming.execute(request)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.content).toBe("test");
    });

    it("should handle split events across chunks", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"hel'
            ),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode('lo"}}\n\n'),
            done: false
          })
          .mockResolvedValueOnce({
            value: new TextEncoder().encode("event: message_stop\ndata: {}\n\n"),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "test" }]
      };

      const chunks = [];
      for await (const chunk of streaming.execute(request)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.content).toBe("hello");
    });

    it("should handle custom headers", async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode("event: message_stop\ndata: {}\n\n"),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const request: ChatRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "test" }],
        headers: {
          "x-custom-header": "test-value"
        }
      };

      const chunks = [];
      for await (const chunk of streaming.execute(request)) {
        chunks.push(chunk);
      }

      const fetchCall = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(fetchCall[1].headers["x-custom-header"]).toBe("test-value");
    });
  });
});
