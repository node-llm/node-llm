import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIStreaming } from "../../../../src/providers/openai/Streaming.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";

describe("OpenAI Streaming - Error Handling", () => {
  let streaming: OpenAIStreaming;

  beforeEach(() => {
    streaming = new OpenAIStreaming("https://api.openai.com/v1", "test-key");
  });

  it("should handle API errors (401 Unauthorized)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: { message: "Invalid API key" } }),
    });

    const request: ChatRequest = {
      model: "gpt-4",
      messages: [{ role: "user", content: "test" }],
    };

    await expect(async () => {
      for await (const _ of streaming.execute(request)) {
        // Should not reach here
      }
    }).rejects.toThrow();
  });

  it("should handle API errors (429 Rate Limit)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      json: async () => ({ error: { message: "Rate limit exceeded" } }),
    });

    const request: ChatRequest = {
      model: "gpt-4",
      messages: [{ role: "user", content: "test" }],
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
      body: null,
    });

    const request: ChatRequest = {
      model: "gpt-4",
      messages: [{ role: "user", content: "test" }],
    };

    await expect(async () => {
      for await (const _ of streaming.execute(request)) {
        // Should not reach here
      }
    }).rejects.toThrow("No response body for streaming");
  });
});

describe("OpenAI Streaming - Edge Cases", () => {
  let streaming: OpenAIStreaming;

  beforeEach(() => {
    streaming = new OpenAIStreaming("https://api.openai.com/v1", "test-key");
  });

  it("should handle empty stream (immediate [DONE])", async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("data: [DONE]\n\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true }),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    });

    const request: ChatRequest = {
      model: "gpt-4",
      messages: [{ role: "user", content: "test" }],
    };

    const chunks = [];
    for await (const chunk of streaming.execute(request)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(0);
  });

  it("should handle malformed JSON gracefully", async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('data: {"invalid json\n\n'),
          done: false,
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"valid"}}]}\n\n'),
          done: false,
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("data: [DONE]\n\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true }),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    });

    const request: ChatRequest = {
      model: "gpt-4",
      messages: [{ role: "user", content: "test" }],
    };

    const chunks = [];
    for await (const chunk of streaming.execute(request)) {
      chunks.push(chunk);
    }

    // Should skip malformed JSON and only yield valid chunk
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe("valid");
  });

  it("should handle stream with only whitespace", async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("   \n\n"),
          done: false,
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("data: [DONE]\n\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true }),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    });

    const request: ChatRequest = {
      model: "gpt-4",
      messages: [{ role: "user", content: "test" }],
    };

    const chunks = [];
    for await (const chunk of streaming.execute(request)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(0);
  });
});

describe("OpenAI Streaming - Buffer Management", () => {
  let streaming: OpenAIStreaming;

  beforeEach(() => {
    streaming = new OpenAIStreaming("https://api.openai.com/v1", "test-key");
  });

  it("should handle split SSE events across chunks", async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          // First chunk: incomplete event
          value: new TextEncoder().encode('data: {"choices":[{"delta":'),
          done: false,
        })
        .mockResolvedValueOnce({
          // Second chunk: completes the event
          value: new TextEncoder().encode('{"content":"test"}}]}\n\n'),
          done: false,
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("data: [DONE]\n\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true }),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    });

    const request: ChatRequest = {
      model: "gpt-4",
      messages: [{ role: "user", content: "test" }],
    };

    const chunks = [];
    for await (const chunk of streaming.execute(request)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe("test");
  });

  it("should handle multiple events in single chunk", async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"first"}}]}\n\n' +
            'data: {"choices":[{"delta":{"content":"second"}}]}\n\n'
          ),
          done: false,
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("data: [DONE]\n\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true }),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    });

    const request: ChatRequest = {
      model: "gpt-4",
      messages: [{ role: "user", content: "test" }],
    };

    const chunks = [];
    for await (const chunk of streaming.execute(request)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toBe("first");
    expect(chunks[1].content).toBe("second");
  });

  it("should handle split 'data:' prefix across chunks", async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("da"),
          done: false,
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('ta: {"choices":[{"delta":{"content":"test"}}]}\n\n'),
          done: false,
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("data: [DONE]\n\n"),
          done: false,
        })
        .mockResolvedValueOnce({ done: true }),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    });

    const request: ChatRequest = {
      model: "gpt-4",
      messages: [{ role: "user", content: "test" }],
    };

    const chunks = [];
    for await (const chunk of streaming.execute(request)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe("test");
  });
});
