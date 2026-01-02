import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeepSeekChat } from "../../../../src/providers/deepseek/Chat.js";

describe("DeepSeekChat", () => {
    const baseUrl = "https://api.test";
    const apiKey = "test-key";
    let chat: DeepSeekChat;
    
    beforeEach(() => {
        chat = new DeepSeekChat(baseUrl, apiKey);
        // Mock global fetch
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it("should make a correct POST request", async () => {
        const mockResponse = {
            id: "msg_123",
            choices: [{
                message: { content: "Hello world" },
                finish_reason: "stop"
            }],
            usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15
            }
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const request = {
            model: "deepseek-chat",
            messages: [{ role: "user", content: "Hi" }]
        };

        const response = await chat.execute(request as any);

        expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/chat/completions`, expect.objectContaining({
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: expect.stringContaining('"messages":[{"role":"user","content":"Hi"}]')
        }));
        
        expect(response.content).toBe("Hello world");
        expect(response.usage).toEqual({
            input_tokens: 10,
            output_tokens: 5,
            total_tokens: 15,
            cached_tokens: undefined,
            cache_creation_tokens: undefined,
            cost: expect.any(Number),
            input_cost: expect.any(Number),
            output_cost: expect.any(Number)
        });
    });

    it("should capture reasoning_content if present", async () => {
        const mockResponse = {
            choices: [{
                message: { 
                    content: "Answer",
                    reasoning_content: "Thought process"
                },
                finish_reason: "stop"
            }],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const response = await chat.execute({ model: "deepseek-reasoner", messages: [] } as any);

        expect(response.content).toBe("Answer");
        expect(response.reasoning).toBe("Thought process");
    });

    it("should handle API errors", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 400,
            text: async () => "Bad Request"
        });

        await expect(chat.execute({ model: "deepseek-chat", messages: [] } as any))
            .rejects.toThrow("DeepSeek API error: 400 - Bad Request");
    });

    it("should handle structured output (json_schema conversion)", async () => {
         const mockResponse = {
            choices: [{ message: { content: "{}" }, finish_reason: "stop" }],
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const request = {
            model: "deepseek-chat",
            messages: [],
            response_format: {
                type: "json_schema",
                json_schema: { schema: { type: "object" } }
            }
        };

        await chat.execute(request as any);

        expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            body: expect.stringContaining('"response_format":{"type":"json_object"}')
        }));
        
        // Verify system prompt injection
        expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            body: expect.stringContaining('output strictly valid JSON')
        }));
    });
});
