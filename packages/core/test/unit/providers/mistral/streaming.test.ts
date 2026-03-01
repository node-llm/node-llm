import { describe, it, expect, vi, beforeEach } from "vitest";
import { MistralStreaming } from "../../../../src/providers/mistral/Streaming.js";
import { fetchWithTimeout } from "../../../../src/utils/fetch.js";

vi.mock("../../../../src/utils/fetch.js", () => ({
  fetchWithTimeout: vi.fn()
}));

vi.mock("../../../../src/utils/logger.js", () => ({
  logger: {
    logRequest: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}));

describe("MistralStreaming", () => {
  let streaming: MistralStreaming;

  beforeEach(() => {
    vi.clearAllMocks();
    streaming = new MistralStreaming("https://api.mistral.ai/v1", "test-api-key");
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
      model: "mistral-large-latest",
      messages: [{ role: "user", content: "Hi" }]
    })) {
      if (chunk.content) results.push(chunk.content);
    }

    expect(results).toEqual(["Hello", " World"]);
  });

  it("handles tool calls in stream", async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"get_weather","arguments":""}}]}}]}\n\n',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"loc"}}]}}]}\n\n',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"ation\\": \\"Paris\\"}"}}]}}]}\n\n',
      "data: [DONE]\n\n"
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    const toolCalls: unknown[] = [];
    for await (const chunk of streaming.execute({
      model: "mistral-large-latest",
      messages: [{ role: "user", content: "What's the weather?" }]
    })) {
      if (chunk.tool_calls) {
        toolCalls.push(...chunk.tool_calls);
      }
    }

    expect(toolCalls.length).toBeGreaterThan(0);
  });

  it("handles API errors gracefully", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse([], false, 401) as unknown as Response
    );

    const generator = streaming.execute({
      model: "mistral-large-latest",
      messages: []
    });

    await expect(async () => {
      for await (const _ of generator) {
        // consume
      }
    }).rejects.toThrow();
  });

  it("reports usage in final chunk", async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Test"}}]}\n\n',
      'data: {"choices":[{"delta":{}}],"usage":{"prompt_tokens":10,"completion_tokens":5,"total_tokens":15}}\n\n',
      "data: [DONE]\n\n"
    ];

    vi.mocked(fetchWithTimeout).mockResolvedValue(
      createMockResponse(chunks) as unknown as Response
    );

    let lastUsage = null;
    for await (const chunk of streaming.execute({
      model: "mistral-large-latest",
      messages: []
    })) {
      if (chunk.usage) {
        lastUsage = chunk.usage;
      }
    }

    expect(lastUsage).toBeTruthy();
  });
});
