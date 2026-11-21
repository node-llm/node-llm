import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import {
  Provider,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  Usage
} from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import { CostLimitError } from "../../../src/errors/index.js";
import { defineAgent } from "../../../src/agent/Agent.js";
import { createLLM } from "../../../src/llm.js";

const turn: Usage = { input_tokens: 10, output_tokens: 5, total_tokens: 15, cost: 0.01 };
const picture: Usage = { input_tokens: 1000, output_tokens: 20, total_tokens: 1020, cost: 0.05 };

// Calls `look` until told to stop, each request costing $0.01.
class Looking implements Provider {
  id = "scripted";
  requests = 0;
  constructor(private looks: number) {}
  defaultModel() {
    return "test-model";
  }
  async chat(_request: ChatRequest): Promise<ChatResponse> {
    this.requests++;
    if (this.requests > this.looks) return { content: "Done.", usage: { ...turn } };
    return {
      content: null,
      usage: { ...turn },
      tool_calls: [
        { id: `c${this.requests}`, type: "function", function: { name: "look", arguments: "{}" } }
      ]
    };
  }
  async *stream(request: ChatRequest): AsyncGenerator<ChatChunk> {
    const response = await this.chat(request);
    yield {
      content: response.content ?? "",
      tool_calls: response.tool_calls,
      usage: response.usage
    };
  }
  formatToolResultMessage(toolCallId: string, content: string): Message {
    return { role: "tool", tool_call_id: toolCallId, content };
  }
}

// A tool that asks another model about a picture, and counts that call on the chat.
const lookingTool = (chat: () => { countUsage(usage: Usage): unknown }) => ({
  type: "function" as const,
  function: { name: "look", description: "Look", parameters: { type: "object", properties: {} } },
  handler: async () => {
    chat().countUsage({ ...picture });
    return "a button";
  }
});

describe("countUsage", () => {
  it("adds a side call to the ask's usage and the chat's total", async () => {
    const chat: Chat = new Chat(new Looking(1), "test-model", { tools: [lookingTool(() => chat)] });

    const response = await chat.ask("Find the button");

    expect(response.usage).toMatchObject({ total_tokens: 15 + 1020 + 15 });
    expect(response.usage.cost).toBeCloseTo(0.07);
    expect(chat.totalUsage.total_tokens).toBe(1050);
    expect(chat.totalUsage.cost).toBeCloseTo(0.07);
  });

  it("counts toward maxCost", async () => {
    const provider = new Looking(10);
    const chat: Chat = new Chat(provider, "test-model", {
      tools: [lookingTool(() => chat)],
      maxCost: 0.1
    });

    const error = await chat.ask("Find the button").catch((caught) => caught);

    // Requests cost $0.01 and pictures $0.05: $0.13 after the third request, whose tool calls
    // are not run. Without the pictures, the limit would have allowed ten requests.
    expect(error).toBeInstanceOf(CostLimitError);
    expect(error.usage.cost).toBeCloseTo(0.13);
    expect(provider.requests).toBe(3);
  });

  it("counts toward maxCost when streaming", async () => {
    const provider = new Looking(10);
    const chat: Chat = new Chat(provider, "test-model", {
      tools: [lookingTool(() => chat)],
      maxCost: 0.1
    });
    const drain = async () => {
      for await (const _chunk of chat.stream("Find the button")) void _chunk;
    };

    await expect(drain()).rejects.toBeInstanceOf(CostLimitError);
    expect(provider.requests).toBe(3);
  });

  it("adds a call made between asks to the chat's total only", async () => {
    const chat = new Chat(new Looking(0), "test-model");
    const first = await chat.ask("Hi");

    chat.countUsage({ ...picture });

    expect(first.usage.total_tokens).toBe(15);
    expect(chat.totalUsage.total_tokens).toBe(1035);
  });

  it("is on agents too", async () => {
    const Explorer = defineAgent({
      model: "test-model",
      tools: [lookingTool(() => agent)],
      assumeModelExists: true
    });
    const agent = new Explorer({ llm: createLLM({ provider: new Looking(1) }) });

    const response = await agent.ask("Find the button");

    expect(response.usage.cost).toBeCloseTo(0.07);
    expect(agent.totalUsage.cost).toBeCloseTo(0.07);
  });
});
