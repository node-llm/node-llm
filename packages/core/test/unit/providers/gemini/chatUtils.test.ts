import { describe, it, expect, vi } from "vitest";
import { GeminiChatUtils } from "../../../../src/providers/gemini/ChatUtils.js";
import { Message } from "../../../../src/chat/Message.js";
import { BinaryUtils } from "../../../../src/utils/Binary.js";

vi.mock("../../../../src/utils/Binary.js");

describe("GeminiChatUtils", () => {
  it("should convert basic messages", async () => {
    const messages: Message[] = [
      { role: "system", content: "Instruction" },
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" }
    ];

    const { contents, systemInstructionParts } = await GeminiChatUtils.convertMessages(messages);

    expect(systemInstructionParts).toHaveLength(1);
    expect(systemInstructionParts[0].text).toBe("Instruction");
    
    expect(contents).toHaveLength(2);
    expect(contents[0].role).toBe("user");
    expect(contents[0].parts[0].text).toBe("Hello");
    expect(contents[1].role).toBe("model");
    expect(contents[1].parts[0].text).toBe("Hi");
  });

  it("should handle tool responses", async () => {
    const messages: Message[] = [
      { role: "tool", tool_call_id: "call1", content: '{"status":"ok"}' }
    ];

    const { contents } = await GeminiChatUtils.convertMessages(messages);

    expect(contents).toHaveLength(1);
    expect(contents[0].role).toBe("user"); // Gemini expects tool responses as part of user role turn in some API versions, or handled via tool_results
    expect(contents[0].parts[0].functionResponse).toBeDefined();
    expect(contents[0].parts[0].functionResponse!.name).toBe("call1");
  });

  it("should handle assistant tool calls", async () => {
    const messages: Message[] = [
      { 
        role: "assistant", 
        content: null as any, 
        tool_calls: [{ id: "call1", type: "function", function: { name: "get_weather", arguments: '{"city":"London"}' } }] 
      }
    ];

    const { contents } = await GeminiChatUtils.convertMessages(messages);

    expect(contents).toHaveLength(1);
    expect(contents[0].parts[0].functionCall).toBeDefined();
    expect(contents[0].parts[0].functionCall!.name).toBe("get_weather");
    expect(contents[0].parts[0].functionCall!.args).toEqual({ city: "London" });
  });

  it("should handle multimodal content", async () => {
    (BinaryUtils.toBase64 as any).mockResolvedValue({ mimeType: "image/png", data: "base64data" });

    const messages: Message[] = [
      { 
        role: "user", 
        content: [
          { type: "text", text: "Look" },
          { type: "image_url", image_url: { url: "data:image/png;base64,..." } }
        ] 
      } as any
    ];

    const { contents } = await GeminiChatUtils.convertMessages(messages);

    expect(contents[0].parts).toHaveLength(2);
    expect(contents[0].parts[0].text).toBe("Look");
    expect(contents[0].parts[1].inlineData).toBeDefined();
    expect(contents[0].parts[1].inlineData!.mimeType).toBe("image/png");
    expect(contents[0].parts[1].inlineData!.data).toBe("base64data");
  });
});
