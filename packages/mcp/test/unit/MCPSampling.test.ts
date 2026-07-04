import { describe, it, expect, vi } from "vitest";
import { createLLMSamplingHandler, resolveSamplingHandler } from "../../src/MCPSampling.js";
import { NodeLLMCore } from "@node-llm/core";

function makeFakeChat(responseText: string, finishReason: string | null = "stop") {
  return {
    withInstructions: vi.fn().mockReturnThis(),
    withTemperature: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    ask: vi.fn().mockResolvedValue({
      model: "fake-model",
      finish_reason: finishReason,
      toString: () => responseText
    })
  };
}

function makeFakeLLM(chat: ReturnType<typeof makeFakeChat>, defaultChatModel?: string) {
  return {
    defaultChatModel,
    chat: vi.fn().mockReturnValue(chat)
  } as unknown as NodeLLMCore;
}

describe("MCPSampling", () => {
  describe("resolveSamplingHandler", () => {
    it("returns undefined when no option is given", () => {
      expect(resolveSamplingHandler(undefined)).toBeUndefined();
    });

    it("returns the function as-is when a handler function is given", () => {
      const handler = vi.fn();
      expect(resolveSamplingHandler(handler)).toBe(handler);
    });

    it("builds an LLM-backed handler when { llm, model } is given", () => {
      const chat = makeFakeChat("hi");
      const llm = makeFakeLLM(chat);
      const handler = resolveSamplingHandler({ llm, model: "gpt-4o" });
      expect(typeof handler).toBe("function");
    });
  });

  describe("createLLMSamplingHandler", () => {
    it("replays the sampling request as a chat and maps the result back", async () => {
      const chat = makeFakeChat("Hello there!", "stop");
      const llm = makeFakeLLM(chat);
      const handler = createLLMSamplingHandler(llm, "gpt-4o");

      const result = await handler({
        maxTokens: 100,
        systemPrompt: "Be terse.",
        temperature: 0.2,
        messages: [{ role: "user", content: { type: "text", text: "Say hi" } }]
      } as any);

      expect(llm.chat).toHaveBeenCalledWith("gpt-4o", { maxTokens: 100 });
      expect(chat.withInstructions).toHaveBeenCalledWith("Be terse.");
      expect(chat.withTemperature).toHaveBeenCalledWith(0.2);
      expect(chat.ask).toHaveBeenCalledWith("Say hi");
      expect(result).toEqual({
        model: "fake-model",
        role: "assistant",
        content: { type: "text", text: "Hello there!" },
        stopReason: "endTurn"
      });
    });

    it("replays prior turns via chat.add before asking the final message", async () => {
      const chat = makeFakeChat("ok");
      const llm = makeFakeLLM(chat);
      const handler = createLLMSamplingHandler(llm, "gpt-4o");

      await handler({
        maxTokens: 50,
        messages: [
          { role: "user", content: { type: "text", text: "first" } },
          { role: "assistant", content: { type: "text", text: "second" } },
          { role: "user", content: { type: "text", text: "third" } }
        ]
      } as any);

      expect(chat.add).toHaveBeenNthCalledWith(1, "user", "first");
      expect(chat.add).toHaveBeenNthCalledWith(2, "assistant", "second");
      expect(chat.ask).toHaveBeenCalledWith("third");
    });

    it("extracts text from array-shaped content blocks", async () => {
      const chat = makeFakeChat("ok");
      const llm = makeFakeLLM(chat);
      const handler = createLLMSamplingHandler(llm, "gpt-4o");

      await handler({
        maxTokens: 50,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "part one" },
              { type: "image", data: "...", mimeType: "image/png" },
              { type: "text", text: "part two" }
            ]
          }
        ]
      } as any);

      expect(chat.ask).toHaveBeenCalledWith("part one\npart two");
    });

    it("falls back to the llm's defaultChatModel when no model override is given", async () => {
      const chat = makeFakeChat("ok");
      const llm = makeFakeLLM(chat, "default-model");
      const handler = createLLMSamplingHandler(llm);

      await handler({ maxTokens: 10, messages: [] } as any);

      expect(llm.chat).toHaveBeenCalledWith("default-model", { maxTokens: 10 });
    });

    it("throws a clear error when no model can be resolved", async () => {
      const chat = makeFakeChat("ok");
      const llm = makeFakeLLM(chat);
      const handler = createLLMSamplingHandler(llm);

      await expect(handler({ maxTokens: 10, messages: [] } as any)).rejects.toThrow(
        /Sampling requires a model/
      );
    });

    it("maps a length/max_tokens finish reason to maxTokens", async () => {
      const chat = makeFakeChat("ok", "length");
      const llm = makeFakeLLM(chat);
      const handler = createLLMSamplingHandler(llm, "gpt-4o");

      const result = await handler({ maxTokens: 10, messages: [] } as any);
      expect(result.stopReason).toBe("maxTokens");
    });
  });
});
