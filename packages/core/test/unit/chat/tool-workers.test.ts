import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";
import { ToolDefinition } from "../../../src/chat/Tool.js";

function slowTool(state: { running: number; peak: number; order: string[] }): ToolDefinition {
  return {
    type: "function",
    function: {
      name: "fetch_page",
      parameters: { type: "object", properties: { n: { type: "number" } } }
    },
    handler: async ({ n }: { n: number }) => {
      state.running++;
      state.peak = Math.max(state.peak, state.running);
      await new Promise((resolve) => setTimeout(resolve, 10 + (5 - n) * 3));
      state.running--;
      state.order.push(`done ${n}`);
      return `page ${n}`;
    }
  };
}

const fiveCalls = {
  content: null,
  tool_calls: [1, 2, 3, 4, 5].map((n) => ({
    id: `c${n}`,
    type: "function" as const,
    function: { name: "fetch_page", arguments: JSON.stringify({ n }) }
  }))
};

async function run(concurrency: boolean | number, mode: "ask" | "stream" = "ask") {
  const state = { running: 0, peak: 0, order: [] as string[] };
  const provider = new FakeProvider([fiveCalls, "done"]);
  const chat = new Chat(provider, "m", { tools: [slowTool(state)], toolConcurrency: concurrency });
  if (mode === "ask") await chat.ask("go");
  else for await (const _chunk of chat.stream("go")) void _chunk;
  const results = provider
    .lastRequest!.messages.filter((m) => m.role === "tool")
    .map((m) => m.content);
  return { ...state, results };
}

describe("toolConcurrency as a number", () => {
  it("runs at most that many calls at once, and every call", async () => {
    for (const mode of ["ask", "stream"] as const) {
      const { peak, results } = await run(2, mode);
      expect(peak, mode).toBe(2);
      expect(results, mode).toEqual(["page 1", "page 2", "page 3", "page 4", "page 5"]);
    }
  });

  it("runs every call at once with true, and one at a time with false", async () => {
    expect((await run(true)).peak).toBe(5);
    expect((await run(false)).peak).toBe(1);
  });

  it("keeps results in call order though calls finish out of order", async () => {
    const { order, results } = await run(5);
    expect(order[0]).not.toBe("done 1");
    expect(results).toEqual(["page 1", "page 2", "page 3", "page 4", "page 5"]);
  });
});
