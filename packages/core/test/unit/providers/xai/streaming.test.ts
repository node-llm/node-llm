import { describe, it, expect, vi, beforeEach } from "vitest";
import { XAIStreaming } from "../../../../src/providers/xai/Streaming.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";

describe("xAI Streaming - Error Handling", () => {
  let streaming: XAIStreaming;

  beforeEach(() => {
    streaming = new XAIStreaming("https://api.x.ai/v1", "test-key");
  });

  it("should throw on 401 Unauthorized", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "Invalid API key" } })
    });

    const request: ChatRequest = {
      model: "grok-3",
      messages: [{ role: "user", content: "test" }]
    };

    await expect(async () => {
      for await (const _ of streaming.execute(request)) {
        // Should not reach here
      }
    }).rejects.toThrow();
  });

  it("should throw on 429 Rate Limit", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: "Rate limit exceeded" } })
    });

    const request: ChatRequest = {
      model: "grok-3",
      messages: [{ role: "user", content: "test" }]
    };

    await expect(async () => {
      for await (const _ of streaming.execute(request)) {
        // Should not reach here
      }
    }).rejects.toThrow();
  });

  it("should throw when response body is null", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: null
    });

    const request: ChatRequest = {
      model: "grok-3",
      messages: [{ role: "user", content: "test" }]
    };

    await expect(async () => {
      for await (const _ of streaming.execute(request)) {
        // Should not reach here
      }
    }).rejects.toThrow("No response body for streaming");
  });
});

describe("xAI Streaming - SSE Parsing", () => {
  let streaming: XAIStreaming;

  beforeEach(() => {
    streaming = new XAIStreaming("https://api.x.ai/v1", "test-key");
  });

  it("should handle immediate [DONE] (empty stream)", async () => {
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ value: new TextEncoder().encode("data: [DONE]\n\n"), done: false })
        .mockResolvedValueOnce({ done: true })
    };

    global.fetch = vi.fn().mockResolvedValue({ ok: true, body: { getReader: () => mockReader } });

    const chunks = [];
    for await (const chunk of streaming.execute({
      model: "grok-3",
      messages: [{ role: "user", content: "test" }]
    } as ChatRequest)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(0);
  });

  it("should yield content chunks from SSE stream", async () => {
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'),
          done: false
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" World"}}]}\n\n'),
          done: false
        })
        .mockResolvedValueOnce({ value: new TextEncoder().encode("data: [DONE]\n\n"), done: false })
        .mockResolvedValueOnce({ done: true })
    };

    global.fetch = vi.fn().mockResolvedValue({ ok: true, body: { getReader: () => mockReader } });

    const chunks = [];
    for await (const chunk of streaming.execute({
      model: "grok-3",
      messages: [{ role: "user", content: "test" }]
    } as ChatRequest)) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThanOrEqual(1);
    const fullText = chunks.map((c) => c.content).join("");
    expect(fullText).toContain("Hello");
  });

  it("should gracefully skip malformed JSON lines", async () => {
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({
          value: new TextEncoder().encode("data: {invalid json\n\n"),
          done: false
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"valid"}}]}\n\n'),
          done: false
        })
        .mockResolvedValueOnce({ value: new TextEncoder().encode("data: [DONE]\n\n"), done: false })
        .mockResolvedValueOnce({ done: true })
    };

    global.fetch = vi.fn().mockResolvedValue({ ok: true, body: { getReader: () => mockReader } });

    const chunks = [];
    for await (const chunk of streaming.execute({
      model: "grok-3",
      messages: [{ role: "user", content: "test" }]
    } as ChatRequest)) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe("valid");
  });
});
