import { describe, it, expect } from "vitest";
import { ChatResponseString } from "../../../src/chat/ChatResponse.js";

describe("ChatResponseString", () => {
  it("holds metadata and tool_calls", () => {
    const usage = { input_tokens: 1, output_tokens: 2, total_tokens: 3 };
    const tool_calls = [
      { id: "1", type: "function" as const, function: { name: "test", arguments: "{}" } }
    ];
    const res = new ChatResponseString("hello", usage, "model", "provider", "logic", tool_calls);

    expect(String(res)).toBe("hello");
    expect(res.usage).toEqual(usage);
    expect(res.tool_calls).toEqual(tool_calls);
    expect(res.inputTokens).toBe(1);
    expect(res.outputTokens).toBe(2);
    expect(res.totalTokens).toBe(3);

    expect(res.meta).toEqual({
      usage,
      model: "model",
      provider: "provider",
      reasoning: "logic",
      tool_calls
    });
  });
});
