import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { OpenAIChat } from "../../../../src/providers/openai/Chat.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";

describe("OpenAIChat", () => {
  const baseUrl = "https://api.openai.com/v1";
  const apiKey = "test-key";
  let chat: OpenAIChat;

  beforeEach(() => {
    chat = new OpenAIChat(baseUrl, apiKey);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should execute a chat request", async () => {
    const request: ChatRequest = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello" }]
    };

    const mockResponse = {
      choices: [{ message: { content: "Hi!" } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
    };

    (fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await chat.execute(request);

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/chat/completions`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" })
      })
    );
    expect(result.content).toBe("Hi!");
    expect(result.usage?.total_tokens).toBe(15);
  });

  it("should handle tool calls in response", async () => {
    const request: ChatRequest = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Weather?" }]
    };

    const mockResponse = {
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              { id: "call1", type: "function", function: { name: "get_weather", arguments: "{}" } }
            ]
          }
        }
      ]
    };

    (fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await chat.execute(request);

    expect(result.content).toBeNull();
    expect(result.tool_calls).toHaveLength(1);
    expect(result.tool_calls?.[0]?.function.name).toBe("get_weather");
  });

  it("should throw error on empty response", async () => {
    const request: ChatRequest = { model: "gpt-4o", messages: [] };

    (fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: {} }] })
    });

    await expect(chat.execute(request)).rejects.toThrow("OpenAI returned empty response");
  });

  it("should enforce strict JSON schema constraints for OpenAI structured outputs", async () => {
    const request: ChatRequest = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Extract data" }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "test_schema",
          strict: true,
          schema: {
            type: "object",
            properties: { a: { type: "string" } }
          }
        }
      }
    };

    (fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "{}" } }] })
    });

    await chat.execute(request);

    // Verify fetch was called with strict: true and additionalProperties: false
    const fetchCallInfo = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    const requestBody = JSON.parse(fetchCallInfo.body as string);

    expect(requestBody.response_format?.json_schema?.strict).toBe(true);
    expect(requestBody.response_format?.json_schema?.schema?.additionalProperties).toBe(false);
    expect(requestBody.response_format?.json_schema?.schema?.required).toEqual(["a"]);
  });

  it("should enforce strict JSON schema constraints for OpenAI tools", async () => {
    const request: ChatRequest = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Weather" }],
      tools: [
        {
          type: "function",
          function: {
            name: "get_weather",
            strict: true,
            parameters: {
              type: "object",
              properties: { location: { type: "string" } }
            }
          }
        }
      ]
    };

    (fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "{}" } }] })
    });

    await chat.execute(request);

    // Verify fetch was called with strict formatting on the tool parameters
    const fetchCallInfo = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    const requestBody = JSON.parse(fetchCallInfo.body as string);

    const tool = requestBody.tools[0];
    expect(tool.function.strict).toBe(true);
    expect(tool.function.parameters?.additionalProperties).toBe(false);
    expect(tool.function.parameters?.required).toEqual(["location"]);
  });
});
