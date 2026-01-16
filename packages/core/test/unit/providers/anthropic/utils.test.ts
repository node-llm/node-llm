import { describe, it, expect } from "vitest";
import { formatSystemPrompt, formatMessages } from "../../../../src/providers/anthropic/Utils.js";
import { Message } from "../../../../src/chat/Message.js";

describe("Anthropic Utils", () => {
  describe("formatSystemPrompt", () => {
    it("should extract system prompt from messages", () => {
      const messages: Message[] = [
        { role: "system", content: "You are a helpful assistant" },
        { role: "user", content: "Hello" }
      ];
      expect(formatSystemPrompt(messages)).toBe("You are a helpful assistant");
    });

    it("should handle array of content parts in system message", () => {
      const messages: Message[] = [
        {
          role: "system",
          content: [
            { type: "text", text: "Part 1" },
            { type: "text", text: "Part 2" }
          ]
        } as unknown as Message,
        { role: "user", content: "Hello" }
      ];
      expect(formatSystemPrompt(messages)).toBe("Part 1\nPart 2");
    });

    it("should return undefined if no system message", () => {
      const messages: Message[] = [{ role: "user", content: "Hello" }];
      expect(formatSystemPrompt(messages)).toBeUndefined();
    });
  });

  describe("formatMessages", () => {
    it("should format basic messages", () => {
      const messages: Message[] = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" }
      ];
      const result = formatMessages(messages);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ role: "user", content: "Hello" });
      expect(result[1]).toEqual({ role: "assistant", content: "Hi there!" });
    });

    it("should merge consecutive messages with same role", () => {
      const messages: Message[] = [
        { role: "user", content: "Hello" },
        { role: "user", content: "Are you there?" }
      ];
      const result = formatMessages(messages);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe("user");
      expect(result[0].content).toHaveLength(2);
      expect((result[0].content as Array<{ text: string }>)[0].text).toBe("Hello");
      expect((result[0].content as Array<{ text: string }>)[1].text).toBe("Are you there?");
    });

    it("should handle tool responses", () => {
      const messages: Message[] = [{ role: "tool", tool_call_id: "call1", content: "Result" }];
      const result = formatMessages(messages);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe("user");
      expect(Array.isArray(result[0].content)).toBe(true);
      expect((result[0].content as Array<{ type: string; tool_use_id: string }>)[0].type).toBe(
        "tool_result"
      );
      expect((result[0].content as Array<{ type: string; tool_use_id: string }>)[0].tool_use_id).toBe(
        "call1"
      );
    });

    it("should handle assistant messages with tool calls", () => {
      const messages: Message[] = [
        {
          role: "assistant",
          content: "Thinking...",
          tool_calls: [
            { id: "call1", type: "function", function: { name: "test", arguments: "{}" } }
          ]
        } as unknown as Message
      ];
      const result = formatMessages(messages);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe("assistant");
      expect(result[0].content).toHaveLength(2);
      const content = result[0].content as Array<{ text?: string; type?: string }>;
      expect(content[0].text).toBe("Thinking...");
      expect(content[1].type).toBe("tool_use");
    });

    it("should handle multimodal content", () => {
      const messages: Message[] = [
        {
          role: "user",
          content: [
            { type: "text", text: "Look at this" },
            {
              type: "image_url",
              image_url: {
                url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
              }
            }
          ]
        } as unknown as Message
      ];
      const result = formatMessages(messages);
      expect(result[0].content).toHaveLength(2);
      const content = result[0].content as Array<{
        type: string;
        source?: { media_type: string };
      }>;
      expect(content[0].type).toBe("text");
      expect(content[1].type).toBe("image");
      expect(content[1].source!.media_type).toBe("image/png");
    });
  });
});
