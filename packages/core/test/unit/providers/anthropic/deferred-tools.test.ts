import { describe, it, expect } from "vitest";
import { buildMessageRequest } from "../../../../src/providers/anthropic/Utils.js";
import { Capabilities } from "../../../../src/providers/anthropic/Capabilities.js";
import { requestTools, TOOL_SEARCH_NAME } from "../../../../src/chat/ToolSearch.js";
import { windowToolResults, OMITTED_TOOL_RESULT } from "../../../../src/chat/ToolResultWindow.js";
import { ToolDefinition } from "../../../../src/chat/Tool.js";
import { Message } from "../../../../src/chat/Message.js";

const tool = (name: string, defer = false): ToolDefinition => ({
  type: "function",
  function: { name, description: `${name} tool`, parameters: { type: "object", properties: {} } },
  ...(defer ? { defer: true } : {})
});

const tools = [tool("lookup_order"), tool("issue_refund", true), tool("send_invoice", true)];

const searched: Message[] = [
  { role: "user", content: "Refund order A-77" },
  {
    role: "assistant",
    content: "",
    tool_calls: [
      {
        id: "call_1",
        type: "function",
        function: { name: TOOL_SEARCH_NAME, arguments: '{"query":"refund"}' }
      }
    ]
  },
  {
    role: "tool",
    tool_call_id: "call_1",
    content: JSON.stringify({ loaded: ["issue_refund"], tools: [] })
  }
];

function body(model: string, messages: Message[]) {
  return buildMessageRequest(
    { model, messages, tools: requestTools(tools, messages) } as Parameters<
      typeof buildMessageRequest
    >[0],
    false
  );
}

describe("Anthropic deferred tools", () => {
  it("sends every tool, deferred ones with defer_loading, in a fixed order", () => {
    const before = body("claude-sonnet-4-5", [searched[0]!]);
    const after = body("claude-sonnet-4-5", searched);

    const shape = (b: typeof before) => b.tools!.map((t) => [t.name, t.defer_loading ?? false]);
    expect(shape(before)).toEqual([
      ["lookup_order", false],
      [TOOL_SEARCH_NAME, false],
      ["issue_refund", true],
      ["send_invoice", true]
    ]);
    expect(shape(after)).toEqual(shape(before));
  });

  it("sends a tool_search result as tool_reference blocks", () => {
    const result = body("claude-sonnet-4-5", searched).messages.at(-1)!;
    expect(result.content).toEqual([
      {
        type: "tool_result",
        tool_use_id: "call_1",
        content: [{ type: "tool_reference", tool_name: "issue_refund" }]
      }
    ]);
  });

  it("keeps the portable form on models without tool search", () => {
    const b = body("claude-3-5-haiku-20241022", searched);
    expect(b.tools!.map((t) => t.name)).toEqual(["lookup_order", TOOL_SEARCH_NAME, "issue_refund"]);
    expect(b.tools!.some((t) => t.defer_loading)).toBe(false);
    const content = b.messages.at(-1)!.content as { content: unknown }[];
    expect(typeof content[0]!.content).toBe("string");
  });

  it("leaves a search that loaded nothing as text", () => {
    const empty = [
      ...searched.slice(0, 2),
      { role: "tool", tool_call_id: "call_1", content: '{"loaded":[],"error":"No tools match"}' }
    ] as Message[];
    const content = body("claude-sonnet-4-5", empty).messages.at(-1)!.content as {
      content: unknown;
    }[];
    expect(typeof content[0]!.content).toBe("string");
  });

  it("knows which models support tool search", () => {
    for (const id of [
      "claude-sonnet-4-5",
      "claude-haiku-4-5",
      "claude-opus-4-8",
      "claude-opus-5-5"
    ]) {
      expect(Capabilities.supportsToolSearch(id), id).toBe(true);
    }
    for (const id of [
      "claude-3-5-haiku-20241022",
      "claude-sonnet-4-20250514",
      "claude-opus-4-1-20250805",
      "claude-opus-4-0"
    ]) {
      expect(Capabilities.supportsToolSearch(id), id).toBe(false);
    }
  });
});

describe("tool result window", () => {
  it("never leaves out tool_search results", () => {
    const messages = windowToolResults(searched, 0);
    expect(messages.at(-1)!.content).not.toBe(OMITTED_TOOL_RESULT);
  });
});
