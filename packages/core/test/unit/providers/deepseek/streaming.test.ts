import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepSeekStreaming } from "../../../../src/providers/deepseek/Streaming.js";
import { fetchWithTimeout } from "../../../../src/utils/fetch.js";

// Mock fetchWithTimeout
vi.mock("../../../../src/utils/fetch.js", () => ({
  fetchWithTimeout: vi.fn()
}));

// Mock logger
vi.mock("../../../../src/utils/logger.js", () => ({
  logger: {
    logRequest: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}));

describe("DeepSeekStreaming", () => {
  let streaming: DeepSeekStreaming;

  beforeEach(() => {
    vi.clearAllMocks();
    streaming = new DeepSeekStreaming("https://api.deepseek.com/v1", "test-api-key");
  });

  function createMockResponse(chunks: string[], ok = true, status = 200) {
    let chunkIndex = 0;
    const reader = {
      read: vi.fn(async () => {
        if (chunkIndex >= chunks.length) {
          return { value: undefined, done: true };
        }
        const value = new TextEncoder().encode(chunks[chunkIndex++]);
        return { value, done: false };
      })
    };

    return {
      ok,
      status,
      statusText: ok ? "OK" : "Error",
      body: { getReader: () => reader },
      text: vi.fn().mockResolvedValue("Error details")
    };
  }

  it("streams content chunks correctly", async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
      "data: [DONE]\n\n"
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: string[] = [];
    for await (const chunk of streaming.execute({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Hi" }]
    })) {
      if (chunk.content) results.push(chunk.content);
    }

    expect(results).toEqual(["Hello", " World"]);
  });

  it("handles reasoning content (DeepSeek-R1 style)", async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"reasoning_content":"Thinking..."}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"Answer"}}]}\n\n',
      "data: [DONE]\n\n"
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: { content: string; reasoning?: string }[] = [];
    for await (const chunk of streaming.execute({
      model: "deepseek-reasoner",
      messages: [{ role: "user", content: "Think about this" }]
    })) {
      results.push({ content: chunk.content || "", reasoning: chunk.reasoning });
    }

    expect(results).toContainEqual(
      expect.objectContaining({ content: "", reasoning: "Thinking..." })
    );
    expect(results).toContainEqual(expect.objectContaining({ content: "Answer" }));
  });

  it("accumulates tool calls across chunks", async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"get_weather"}}]}}]}\n\n',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"city\\":"}}]}}]}\n\n',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\"NYC\\"}"}}]}}]}\n\n',
      "data: [DONE]\n\n"
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    let finalChunk;
    for await (const chunk of streaming.execute({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Weather?" }]
    })) {
      if (chunk.tool_calls) finalChunk = chunk;
    }

    expect(finalChunk?.tool_calls).toHaveLength(1);
    expect(finalChunk?.tool_calls?.[0].function.name).toBe("get_weather");
    expect(finalChunk?.tool_calls?.[0].function.arguments).toBe('{"city":"NYC"}');
  });

  it("throws on API error response", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse([], false, 401) as unknown as Response
    );

    await expect(async () => {
      for await (const _ of streaming.execute({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Hi" }]
      })) {
        // consume
      }
    }).rejects.toThrow("DeepSeek API error: 401");
  });

  it("throws on missing response body", async () => {
    const response = {
      ok: true,
      status: 200,
      body: null
    };

    vi.mocked(fetchWithTimeout).mockResolvedValue(response as unknown as Response);

    await expect(async () => {
      for await (const _ of streaming.execute({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Hi" }]
      })) {
        // consume
      }
    }).rejects.toThrow("No response body for streaming");
  });

  it("handles carriage returns in SSE data", async () => {
    const chunks = ['data: {"choices":[{"delta":{"content":"Test"}}]}\r\n\n', "data: [DONE]\r\n\n"];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: string[] = [];
    for await (const chunk of streaming.execute({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Hi" }]
    })) {
      if (chunk.content) results.push(chunk.content);
    }

    expect(results).toEqual(["Test"]);
  });

  it("handles API error in stream data", async () => {
    const chunks = ['data: {"error":{"message":"Rate limit exceeded"}}\n\n'];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    await expect(async () => {
      for await (const _ of streaming.execute({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Hi" }]
      })) {
        // consume
      }
    }).rejects.toThrow(); // APIError is thrown
  });

  it("gracefully handles abort", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";

    vi.mocked(fetchWithTimeout).mockRejectedValue(abortError);

    const results: unknown[] = [];
    const controller = new AbortController();

    for await (const chunk of streaming.execute(
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Hi" }]
      },
      controller
    )) {
      results.push(chunk);
    }

    // Should complete without throwing
    expect(results).toEqual([]);
  });

  it("ignores malformed JSON in stream", async () => {
    const chunks = [
      "data: {not valid json}\n\n",
      'data: {"choices":[{"delta":{"content":"Valid"}}]}\n\n',
      "data: [DONE]\n\n"
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: string[] = [];
    for await (const chunk of streaming.execute({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Hi" }]
    })) {
      if (chunk.content) results.push(chunk.content);
    }

    expect(results).toEqual(["Valid"]);
  });
});
