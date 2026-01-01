import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeminiChat } from "../../../../src/providers/gemini/Chat.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";
import { GeminiChatUtils } from "../../../../src/providers/gemini/ChatUtils.js";

vi.mock("../../../../src/providers/gemini/ChatUtils.js");

describe("GeminiChat", () => {
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  const apiKey = "test-key";
  let chat: GeminiChat;

  beforeEach(() => {
    chat = new GeminiChat(baseUrl, apiKey);
    vi.stubGlobal("fetch", vi.fn());
    vi.resetAllMocks();
  });

  it("should execute a chat request", async () => {
    const request: ChatRequest = {
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "Hello" }]
    };

    const mockConvert = {
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
      systemInstructionParts: []
    };
    (GeminiChatUtils.convertMessages as any).mockResolvedValue(mockConvert);

    const mockResponse = {
      candidates: [{ 
        content: { role: "model", parts: [{ text: "Hi there!" }] },
        finishReason: "STOP"
      }],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3, totalTokenCount: 8 }
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await chat.execute(request);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/models/gemini-1.5-flash:generateContent?key=test-key"), expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"contents":[{"role":"user","parts":[{"text":"Hello"}]}]')
    }));
    expect(result.content).toBe("Hi there!");
    expect(result.usage?.total_tokens).toBe(8);
  });

  it("should handle JSON mode in request", async () => {
    const request: ChatRequest = {
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "Give me JSON" }],
      response_format: { type: "json_object" }
    };

    (GeminiChatUtils.convertMessages as any).mockResolvedValue({ contents: [], systemInstructionParts: [] });
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ candidates: [] })
    });

    await chat.execute(request);

    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      body: expect.stringContaining('"responseMimeType":"application/json"')
    }));
  });

  it("should sanitize schema in request", async () => {
    const request: ChatRequest = {
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "Schema" }],
      response_format: { 
        type: "json_schema",
        json_schema: {
          name: "test",
          schema: {
            type: "object",
            properties: { name: { type: "string" } },
            additionalProperties: false // Should be stripped
          }
        }
      }
    };

    (GeminiChatUtils.convertMessages as any).mockResolvedValue({ contents: [], systemInstructionParts: [] });
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ candidates: [] })
    });

    await chat.execute(request);

    const callArgs = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(callArgs.generationConfig.responseSchema).toBeDefined();
    expect(callArgs.generationConfig.responseSchema.additionalProperties).toBeUndefined();
  });
});
