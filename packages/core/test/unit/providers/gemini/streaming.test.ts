import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeminiStreaming } from "../../../../src/providers/gemini/Streaming.js";
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

// Mock error handler
vi.mock("../../../../src/providers/gemini/Errors.js", () => ({
  handleGeminiError: vi.fn().mockImplementation(() => {
    throw new Error("Gemini API Error");
  })
}));

describe("GeminiStreaming", () => {
  let streaming: GeminiStreaming;

  beforeEach(() => {
    vi.clearAllMocks();
    streaming = new GeminiStreaming(
      "https://generativelanguage.googleapis.com/v1beta",
      "test-api-key"
    );
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

  it("streams text content correctly", async () => {
    const chunks = [
      'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n',
      'data: {"candidates":[{"content":{"parts":[{"text":" World"}]}}]}\n'
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: string[] = [];
    for await (const chunk of streaming.execute({
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "Hi" }]
    })) {
      if (chunk.content) results.push(chunk.content);
    }

    expect(results).toEqual(["Hello", " World"]);
  });

  it("handles thinking content (thought: true)", async () => {
    const chunks = [
      'data: {"candidates":[{"content":{"parts":[{"text":"Thinking...","thought":true}]}}]}\n',
      'data: {"candidates":[{"content":{"parts":[{"text":"Answer"}]}}]}\n'
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: { content?: string; thinking?: { text: string } }[] = [];
    for await (const chunk of streaming.execute({
      model: "gemini-2.0-flash-thinking-exp",
      messages: [{ role: "user", content: "Think about this" }],
      thinking: { budget: 1000 }
    })) {
      results.push(chunk);
    }

    expect(results).toContainEqual(expect.objectContaining({ thinking: { text: "Thinking..." } }));
    expect(results).toContainEqual(expect.objectContaining({ content: "Answer" }));
  });

  it("handles function calls in stream", async () => {
    const chunks = [
      'data: {"candidates":[{"content":{"parts":[{"functionCall":{"name":"get_weather","args":{"city":"NYC"}}}]}}]}\n'
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    let finalChunk;
    for await (const chunk of streaming.execute({
      model: "gemini-1.5-pro",
      messages: [{ role: "user", content: "Weather?" }],
      tools: [{ type: "function", function: { name: "get_weather", description: "Get weather" } }]
    })) {
      if (chunk.tool_calls) finalChunk = chunk;
    }

    expect(finalChunk?.tool_calls).toHaveLength(1);
    expect(finalChunk?.tool_calls?.[0].function.name).toBe("get_weather");
    expect(finalChunk?.tool_calls?.[0].function.arguments).toBe('{"city":"NYC"}');
  });

  it("throws on API error response", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse([], false, 400) as unknown as Response
    );

    await expect(async () => {
      for await (const _ of streaming.execute({
        model: "gemini-1.5-flash",
        messages: [{ role: "user", content: "Hi" }]
      })) {
        // consume
      }
    }).rejects.toThrow("Gemini API Error");
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
        model: "gemini-1.5-flash",
        messages: [{ role: "user", content: "Hi" }]
      })) {
        // consume
      }
    }).rejects.toThrow("No response body for streaming");
  });

  it("handles carriage returns in SSE data", async () => {
    const chunks = ['data: {"candidates":[{"content":{"parts":[{"text":"Test"}]}}]}\r\n'];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: string[] = [];
    for await (const chunk of streaming.execute({
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "Hi" }]
    })) {
      if (chunk.content) results.push(chunk.content);
    }

    expect(results).toEqual(["Test"]);
  });

  it("gracefully handles abort", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";

    vi.mocked(fetchWithTimeout).mockRejectedValue(abortError);

    const results: unknown[] = [];
    const controller = new AbortController();

    for await (const chunk of streaming.execute(
      {
        model: "gemini-1.5-flash",
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
      "data: {not valid json}\n",
      'data: {"candidates":[{"content":{"parts":[{"text":"Valid"}]}}]}\n'
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: string[] = [];
    for await (const chunk of streaming.execute({
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "Hi" }]
    })) {
      if (chunk.content) results.push(chunk.content);
    }

    expect(results).toEqual(["Valid"]);
  });

  it("handles json_object response format", async () => {
    const chunks = [
      'data: {"candidates":[{"content":{"parts":[{"text":"{\\"key\\":\\"value\\"}"}]}}]}\n'
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: string[] = [];
    for await (const chunk of streaming.execute({
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "JSON please" }],
      response_format: { type: "json_object" }
    })) {
      if (chunk.content) results.push(chunk.content);
    }

    expect(results).toEqual(['{"key":"value"}']);
  });

  it("handles json_schema response format with schema sanitization", async () => {
    const chunks = [
      'data: {"candidates":[{"content":{"parts":[{"text":"{\\"name\\":\\"test\\"}"}]}}]}\n'
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: string[] = [];
    for await (const chunk of streaming.execute({
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "Structured output" }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "test_schema",
          schema: {
            type: "object",
            properties: {
              name: { type: "string" }
            },
            additionalProperties: false, // Should be removed by sanitizer
            $schema: "http://json-schema.org/draft-07/schema#" // Should be removed
          }
        }
      }
    })) {
      if (chunk.content) results.push(chunk.content);
    }

    expect(results).toEqual(['{"name":"test"}']);
  });

  it("skips empty data lines", async () => {
    const chunks = [
      "data: \n",
      'data: {"candidates":[{"content":{"parts":[{"text":"Content"}]}}]}\n'
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: string[] = [];
    for await (const chunk of streaming.execute({
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "Hi" }]
    })) {
      if (chunk.content) results.push(chunk.content);
    }

    expect(results).toEqual(["Content"]);
  });

  it("handles multiple parts in single chunk", async () => {
    const chunks = [
      'data: {"candidates":[{"content":{"parts":[{"text":"Part1"},{"text":"Part2"}]}}]}\n'
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const results: string[] = [];
    for await (const chunk of streaming.execute({
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "Hi" }]
    })) {
      if (chunk.content) results.push(chunk.content);
    }

    expect(results).toEqual(["Part1", "Part2"]);
  });
});
