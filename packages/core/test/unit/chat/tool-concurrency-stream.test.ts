import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";
import { ChatChunk } from "../../../src/providers/Provider.js";

function makeTrackingTool(
  name: string,
  delayMs: number,
  activeCounter: { current: number; max: number }
) {
  return {
    type: "function" as const,
    function: { name, parameters: {} },
    handler: async () => {
      activeCounter.current++;
      activeCounter.max = Math.max(activeCounter.max, activeCounter.current);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      activeCounter.current--;
      return `${name}-result`;
    }
  };
}

async function consume(stream: AsyncIterable<ChatChunk>) {
  for await (const _chunk of stream) {
    // drain
  }
}

describe("Chat.stream tool concurrency", () => {
  it("runs independent tool calls sequentially by default", async () => {
    const activeCounter = { current: 0, max: 0 };
    const provider = new FakeProvider([
      {
        content: null,
        tool_calls: [
          { id: "call_1", type: "function", function: { name: "tool_a", arguments: "{}" } },
          { id: "call_2", type: "function", function: { name: "tool_b", arguments: "{}" } }
        ]
      },
      "done"
    ]);

    const chat = new Chat(provider, "test-model", {
      tools: [
        makeTrackingTool("tool_a", 20, activeCounter),
        makeTrackingTool("tool_b", 20, activeCounter)
      ]
    });

    await consume(chat.stream("Go"));

    expect(activeCounter.max).toBe(1);
  });

  it("runs independent tool calls concurrently when toolConcurrency is enabled", async () => {
    const activeCounter = { current: 0, max: 0 };
    const provider = new FakeProvider([
      {
        content: null,
        tool_calls: [
          { id: "call_1", type: "function", function: { name: "tool_a", arguments: "{}" } },
          { id: "call_2", type: "function", function: { name: "tool_b", arguments: "{}" } }
        ]
      },
      "done"
    ]);

    const chat = new Chat(provider, "test-model", {
      toolConcurrency: true,
      tools: [
        makeTrackingTool("tool_a", 30, activeCounter),
        makeTrackingTool("tool_b", 5, activeCounter)
      ]
    });

    await consume(chat.stream("Go"));

    expect(activeCounter.max).toBe(2);

    const history = chat.history;
    const toolMessages = history.filter((m) => m.role === "tool");
    expect(toolMessages).toHaveLength(2);
    expect(toolMessages[0]!.tool_call_id).toBe("call_1");
    expect(toolMessages[0]!.content).toContain("tool_a-result");
    expect(toolMessages[1]!.tool_call_id).toBe("call_2");
    expect(toolMessages[1]!.content).toContain("tool_b-result");
  });
});
