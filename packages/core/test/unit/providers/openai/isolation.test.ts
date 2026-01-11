import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIProvider } from "../../../../src/providers/openai/OpenAIProvider.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";

describe("OpenAI Role Isolation Mapping", () => {
  const apiKey = "test-key";
  
  // Mock fetch globally
  global.fetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses 'developer' role for GPT-4o on official API", async () => {
    const provider = new OpenAIProvider({ apiKey });
    
    // Mock successful response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Response" } }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
      })
    });

    const request: ChatRequest = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an assistant" },
        { role: "user", content: "Hi" }
      ]
    };

    await provider.chat(request);

    const fetchCall = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.messages[0].role).toBe("developer");
    expect(body.messages[1].role).toBe("user");
  });

  it("falls back to 'system' role for older models", async () => {
    const provider = new OpenAIProvider({ apiKey });
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Response" } }],
      })
    });

    const request: ChatRequest = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an assistant" }
      ]
    };

    await provider.chat(request);

    const fetchCall = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.messages[0].role).toBe("system");
  });

  it("falls back to 'system' role for custom base URLs", async () => {
    // Custom endpoint
    const provider = new OpenAIProvider({ 
      apiKey, 
      baseUrl: "https://my-local-llm.com/v1" 
    });
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Response" } }],
      })
    });

    const request: ChatRequest = {
      model: "gpt-4o", // Even if model is gpt-4o, if it's not official API, don't use developer role
      messages: [
        { role: "system", content: "You are an assistant" }
      ]
    };

    await provider.chat(request);

    const fetchCall = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.messages[0].role).toBe("system");
  });
});
