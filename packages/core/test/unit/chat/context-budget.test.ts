import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";
import { ToolDefinition } from "../../../src/chat/Tool.js";
import { Message } from "../../../src/chat/Message.js";
import {
  applyRequestBudget,
  cutToolResult,
  LEFT_OUT_LATEST_RESULT,
  LEFT_OUT_RESULT
} from "../../../src/chat/ContextBudget.js";

const call = (id: string, args = "{}") => ({
  id,
  type: "function" as const,
  function: { name: "read_page", arguments: args }
});

function round(id: string, size: number): Message[] {
  return [
    { role: "assistant", content: "", tool_calls: [call(id)] },
    { role: "tool", tool_call_id: id, content: "x".repeat(size) }
  ];
}

describe("cutToolResult", () => {
  it("cuts a result over the limit and says so", () => {
    const cut = cutToolResult("a".repeat(5000), { resultChars: 1000 });
    expect(cut.length).toBeLessThanOrEqual(1000);
    expect(cut).toContain("cut to 1000 of 5000 characters");
  });

  it("leaves shorter results and other content alone", () => {
    expect(cutToolResult("short", { resultChars: 1000 })).toBe("short");
    expect(cutToolResult("a".repeat(5000), undefined)).toHaveLength(5000);
  });
});

describe("applyRequestBudget", () => {
  const history: Message[] = [
    { role: "user", content: "research this" },
    ...round("a", 4000),
    ...round("b", 4000),
    ...round("c", 4000)
  ];

  it("sends everything that fits", () => {
    expect(applyRequestBudget(history, { requestChars: 20_000 })).toBe(history);
  });

  it("leaves out the oldest results first and keeps the latest round", () => {
    const sent = applyRequestBudget(history, { requestChars: 9000 });
    const contents = sent.filter((m) => m.role === "tool").map((m) => m.content);
    expect(contents[0]).toBe(LEFT_OUT_RESULT);
    expect(contents[2]).toBe("x".repeat(4000));
    expect(history[2]!.content).toBe("x".repeat(4000)); // history untouched
  });

  it("moves the cut in steps, so a little more growth keeps the same request start", () => {
    const one = applyRequestBudget(history, { requestChars: 10_000 });
    const grown = [...history, { role: "user", content: "and more" } as Message];
    const two = applyRequestBudget(grown, { requestChars: 10_000 });
    expect(two.slice(0, one.length)).toEqual(one);
  });

  it("leaves out the latest round's oldest results when it alone is over budget", () => {
    const big: Message[] = [
      { role: "user", content: "go" },
      { role: "assistant", content: "", tool_calls: [call("a"), call("b")] },
      { role: "tool", tool_call_id: "a", content: "x".repeat(6000) },
      { role: "tool", tool_call_id: "b", content: "y".repeat(6000) }
    ];
    const sent = applyRequestBudget(big, { requestChars: 7000 });
    expect(sent[2]!.content).toBe(LEFT_OUT_LATEST_RESULT);
    expect(sent[3]!.content).toBe("y".repeat(6000));
  });
});

describe("chat with a context budget", () => {
  const tool: ToolDefinition = {
    type: "function",
    function: { name: "read_page", parameters: { type: "object", properties: {} } },
    handler: async () => "z".repeat(10_000)
  };

  it("cuts long results in the transcript for ask() and stream()", async () => {
    for (const mode of ["ask", "stream"] as const) {
      const provider = new FakeProvider([{ content: null, tool_calls: [call("a")] }, "done"]);
      const chat = new Chat(provider, "m", { tools: [tool] }).withContextBudget({
        perResult: 0.1,
        window: 10_000 // 0.1 * 10k tokens * 2 chars = 2000 chars
      });
      if (mode === "ask") await chat.ask("read it");
      else for await (const _chunk of chat.stream("read it")) void _chunk;

      const result = chat.history.find((m) => m.role === "tool")!;
      expect(String(result.content).length, mode).toBeLessThanOrEqual(2000);
      expect(String(result.content), mode).toContain("context budget");
    }
  });

  it("does nothing without a budget", async () => {
    const provider = new FakeProvider([{ content: null, tool_calls: [call("a")] }, "done"]);
    const chat = new Chat(provider, "m", { tools: [tool] });
    await chat.ask("read it");
    expect(String(chat.history.find((m) => m.role === "tool")!.content)).toHaveLength(10_000);
  });
});
