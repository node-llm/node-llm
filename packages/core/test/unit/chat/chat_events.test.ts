import { describe, it, expect, vi } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";
import { FakeStreamingProvider } from "../../fake-streaming-provider.js";

describe("Chat Events", () => {
  it("triggers onNewMessage and onEndMessage for non-streaming requests", async () => {
    const provider = new FakeProvider(["Hello world"]);
    const chat = new Chat(provider, "test-model");

    const onNewMessage = vi.fn();
    const onEndMessage = vi.fn();

    chat
      .onNewMessage(onNewMessage)
      .onEndMessage(onEndMessage);

    await chat.ask("Hello");

    expect(onNewMessage).toHaveBeenCalledTimes(1);
    expect(onEndMessage).toHaveBeenCalledTimes(1);
    
    // Verify payload of onEndMessage
    const endMsg = onEndMessage.mock.calls[0][0];
    expect(endMsg.content).toBe("Hello world");
    expect(endMsg.model).toBe("test-model");
  });

  it("triggers onNewMessage and onEndMessage for streaming requests", async () => {
    const provider = new FakeStreamingProvider();
    const chat = new Chat(provider, "test-stream-model");

    const onNewMessage = vi.fn();
    const onEndMessage = vi.fn();

    chat
      .onNewMessage(onNewMessage)
      .onEndMessage(onEndMessage);

    const streamer = chat.stream("Hello stream");
    for await (const _chunk of streamer) {
      // Consume stream
    }

    expect(onNewMessage).toHaveBeenCalledTimes(1);
    expect(onEndMessage).toHaveBeenCalledTimes(1);

    // Verify payload of onEndMessage
    const endMsg = onEndMessage.mock.calls[0][0];
    expect(endMsg.model).toBe("test-stream-model");
  });

  it("triggers onToolCall and onToolResult during tool execution", async () => {
    // Mock provider that requests a tool then returns final
    const provider = new FakeProvider([
      {
        content: null,
        tool_calls: [{ 
          id: "call_1", 
          type: "function", 
          function: { name: "test_tool", arguments: "{}" } 
        }]
      },
      "Final Answer"
    ]);

    const chat = new Chat(provider, "test-model");
    
    // Mock tool
    const tool = {
      type: "function" as const,
      function: { name: "test_tool", parameters: {} },
      handler: async () => "tool_result"
    };

    const onToolCallStart = vi.fn();
    const onToolCallEnd = vi.fn();

    await chat
      .withTool(tool)
      .onToolCallStart(onToolCallStart)
      .onToolCallEnd(onToolCallEnd)
      .ask("Go");

    expect(onToolCallStart).toHaveBeenCalledTimes(1);
    expect(onToolCallStart.mock.calls[0][0].function.name).toBe("test_tool");

    expect(onToolCallEnd).toHaveBeenCalledTimes(1);
    expect(onToolCallEnd).toHaveBeenCalledWith(expect.anything(), "tool_result");
  });
});
