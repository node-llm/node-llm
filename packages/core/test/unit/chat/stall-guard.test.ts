import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Chat } from "../../../src/chat/Chat.js";
import { defineTool, Tool } from "../../../src/chat/Tool.js";
import { Provider, ChatRequest, ChatResponse, ChatChunk } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import { StalledError } from "../../../src/errors/index.js";
import { defineAgent } from "../../../src/agent/Agent.js";
import { createLLM } from "../../../src/llm.js";

const usage = { input_tokens: 10, output_tokens: 5, total_tokens: 15 };
let ids = 0;
const call = (name: string, args: Record<string, unknown> = {}): ChatResponse => ({
  content: null,
  usage,
  tool_calls: [
    { id: `call_${++ids}`, type: "function", function: { name, arguments: JSON.stringify(args) } }
  ]
});
const text = (content: string): ChatResponse => ({ content, usage });

class ScriptedProvider implements Provider {
  id = "scripted";
  requests: ChatRequest[] = [];
  constructor(private responses: ChatResponse[]) {}

  defaultModel() {
    return "test-model";
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.requests.push({ ...request, messages: [...request.messages] });
    const response = this.responses.shift();
    if (!response) throw new Error("No more responses");
    return response;
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatChunk> {
    const response = await this.chat(request);
    yield { content: response.content ?? "", tool_calls: response.tool_calls, usage };
  }

  formatToolResultMessage(toolCallId: string, content: string): Message {
    return { role: "tool", tool_call_id: toolCallId, content };
  }
}

let page = "home";
const Click = defineTool({
  name: "click",
  description: "Click a button",
  schema: z.object({ label: z.string() }),
  execute: ({ label }) => {
    if (label === "Missing") throw new Error("No button called Missing");
    if (label === "Next") page = `${page}+`;
    return `clicked ${label}, page is ${page}`;
  }
});
const tools = [Click] as unknown as (new () => Tool)[];

describe("stallGuard", () => {
  it("stops a call repeated with the same result, before the next request", async () => {
    page = "home";
    const provider = new ScriptedProvider([
      call("click", { label: "Save" }),
      call("click", { label: "Save" }),
      call("click", { label: "Save" }),
      text("never asked")
    ]);
    const chat = new Chat(provider, "test-model", { tools, stallGuard: { repeats: 3 } });

    const error = await chat.ask("Save the form").catch((caught) => caught);

    expect(error).toBeInstanceOf(StalledError);
    expect(error).toMatchObject({ reason: "repeated", count: 3, code: "STALLED" });
    expect(error.calls[0].function.name).toBe("click");
    expect(error.message).toBe(
      '[NodeLLM] Stalled: the model called click({"label":"Save"}) 3 times with the same result.'
    );
    expect(error.usage.total_tokens).toBe(45);
    expect(provider.requests).toHaveLength(3);
    // Every call that ran has its result, so the chat can be asked again.
    expect(chat.history.filter((m) => m.role === "tool")).toHaveLength(3);
  });

  it("lets a repeated call through while its result changes", async () => {
    page = "home";
    const provider = new ScriptedProvider([
      call("click", { label: "Next" }),
      call("click", { label: "Next" }),
      call("click", { label: "Next" }),
      text("Reached the end.")
    ]);
    const chat = new Chat(provider, "test-model", { tools, stallGuard: { repeats: 2 } });

    expect(String(await chat.ask("Page through"))).toBe("Reached the end.");
  });

  it("stops after calls in a row that failed or got an answer seen before", async () => {
    page = "home";
    const provider = new ScriptedProvider([
      call("click", { label: "Save" }),
      call("click", { label: "Missing" }),
      call("click", { label: "Save" }),
      call("click", { label: "Missing" }),
      text("never asked")
    ]);
    const chat = new Chat(provider, "test-model", { tools, stallGuard: { noProgress: 3 } });

    const error = await chat.ask("Save the form").catch((caught) => caught);

    // The first Save was new; then a failure, the same Save answer again, and a failure.
    expect(error).toBeInstanceOf(StalledError);
    expect(error).toMatchObject({ reason: "no_progress", count: 3 });
    expect(
      error.calls.map((c: { function: { arguments: string } }) => c.function.arguments)
    ).toEqual(['{"label":"Missing"}', '{"label":"Save"}', '{"label":"Missing"}']);
    expect(error.message).toBe(
      '[NodeLLM] Stalled: 3 tool calls in a row made no progress (last: click({"label":"Missing"})).'
    );
    expect(provider.requests).toHaveLength(4);
  });

  it("takes the app's own idea of progress", async () => {
    page = "home";
    const provider = new ScriptedProvider([
      call("click", { label: "Next" }),
      call("click", { label: "Next" }),
      text("never asked")
    ]);
    const chat = new Chat(provider, "test-model", {
      tools,
      stallGuard: { noProgress: 2, progress: (_call, result) => result.includes("checkout") }
    });

    await expect(chat.ask("Get to checkout")).rejects.toMatchObject({ reason: "no_progress" });
  });

  it("does nothing unless set", async () => {
    page = "home";
    const provider = new ScriptedProvider([
      call("click", { label: "Save" }),
      call("click", { label: "Save" }),
      call("click", { label: "Save" }),
      text("Saved.")
    ]);
    const chat = new Chat(provider, "test-model", { tools });

    expect(String(await chat.ask("Save the form"))).toBe("Saved.");
  });

  it("counts each ask on its own", async () => {
    page = "home";
    const provider = new ScriptedProvider([
      call("click", { label: "Save" }),
      text("Saved."),
      call("click", { label: "Save" }),
      text("Saved again.")
    ]);
    const chat = new Chat(provider, "test-model", { tools, stallGuard: { repeats: 2 } });

    await chat.ask("Save the form");
    expect(String(await chat.ask("Save it again"))).toBe("Saved again.");
  });

  it("works when streaming", async () => {
    page = "home";
    const provider = new ScriptedProvider([
      call("click", { label: "Save" }),
      call("click", { label: "Save" }),
      text("never asked")
    ]);
    const chat = new Chat(provider, "test-model", { tools, stallGuard: { repeats: 2 } });
    const drain = async () => {
      for await (const _chunk of chat.stream("Save the form")) void _chunk;
    };

    await expect(drain()).rejects.toBeInstanceOf(StalledError);
    expect(provider.requests).toHaveLength(2);
  });

  it("is set on an agent", async () => {
    page = "home";
    const provider = new ScriptedProvider([
      call("click", { label: "Save" }),
      call("click", { label: "Save" }),
      text("never asked")
    ]);
    const Tester = defineAgent({ model: "test-model", tools, stallGuard: { repeats: 2 } });
    const agent = new Tester({ llm: createLLM({ provider }), assumeModelExists: true });

    await expect(agent.ask("Save the form")).rejects.toBeInstanceOf(StalledError);
  });
});
