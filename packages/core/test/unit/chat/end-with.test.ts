import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Chat } from "../../../src/chat/Chat.js";
import { defineTool, Tool } from "../../../src/chat/Tool.js";
import { Provider, ChatRequest, ChatResponse, ChatChunk } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import { EndToolNotCalledError } from "../../../src/errors/index.js";
import { defineAgent } from "../../../src/agent/Agent.js";
import { createLLM } from "../../../src/llm.js";

const usage = { input_tokens: 10, output_tokens: 5, total_tokens: 15 };
const text = (content: string): ChatResponse => ({ content, usage });
const call = (name: string, id = `call_${name}`): ChatResponse => ({
  content: null,
  usage,
  tool_calls: [{ id, type: "function", function: { name, arguments: "{}" } }]
});

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

const finished: string[] = [];
const Finish = defineTool({
  name: "finish",
  description: "Report the verdict",
  schema: z.object({}),
  execute: () => {
    finished.push("finish");
    return "done";
  }
});
const Look = defineTool({
  name: "look",
  description: "Look at the page",
  schema: z.object({}),
  execute: () => "a page"
});
const tools = [Finish, Look] as unknown as (new () => Tool)[];

const lastUserMessage = (request: ChatRequest) =>
  [...request.messages].reverse().find((m) => m.role === "user")?.content;

describe("endWith", () => {
  it("does nothing when the model calls the tool", async () => {
    const provider = new ScriptedProvider([call("look"), call("finish"), text("Passed.")]);
    const chat = new Chat(provider, "test-model", { tools, endWith: "finish" });

    const response = await chat.ask("Test the page");

    expect(String(response)).toBe("Passed.");
    expect(provider.requests).toHaveLength(3);
  });

  it("reminds the model once when it ends its turn without the tool", async () => {
    const provider = new ScriptedProvider([
      call("look"),
      text("Looks fine."),
      call("finish"),
      text("Passed.")
    ]);
    const chat = new Chat(provider, "test-model", { tools, endWith: "finish" });

    const response = await chat.ask("Test the page");

    expect(String(response)).toBe("Passed.");
    expect(provider.requests).toHaveLength(4);
    expect(lastUserMessage(provider.requests[2])).toBe(
      "You ended your turn without calling the finish tool. Call finish now."
    );
    // The reminder follows the answer it is about.
    expect(provider.requests[2].messages.at(-2)).toMatchObject({
      role: "assistant",
      content: "Looks fine."
    });
  });

  it("throws EndToolNotCalledError when the model still doesn't call it", async () => {
    const provider = new ScriptedProvider([text("Looks fine."), text("Still fine.")]);
    const chat = new Chat(provider, "test-model", { tools, endWith: "finish" });

    const error = await chat.ask("Test the page").catch((caught) => caught);

    expect(error).toBeInstanceOf(EndToolNotCalledError);
    expect(error).toMatchObject({ tool: "finish", code: "END_TOOL_NOT_CALLED" });
    expect(error.usage.total_tokens).toBe(30);
    expect(provider.requests).toHaveLength(2);
  });

  it("takes a reminder of the app's own", async () => {
    const provider = new ScriptedProvider([text("Looks fine."), call("finish"), text("Passed.")]);
    const chat = new Chat(provider, "test-model", {
      tools,
      endWith: { tool: "finish", reminder: "Call finish with your verdict." }
    });

    await chat.ask("Test the page");

    expect(lastUserMessage(provider.requests[1])).toBe("Call finish with your verdict.");
  });

  it("counts only calls in the current ask", async () => {
    const provider = new ScriptedProvider([
      call("finish"),
      text("Passed."),
      text("Nothing to clean."),
      text("Still nothing.")
    ]);
    const chat = new Chat(provider, "test-model", { tools, endWith: "finish" });
    await chat.ask("Test the page");

    await expect(chat.ask("Clean up")).rejects.toBeInstanceOf(EndToolNotCalledError);
  });

  it("can be turned off for one ask", async () => {
    const provider = new ScriptedProvider([text("Nothing to clean.")]);
    const chat = new Chat(provider, "test-model", { tools, endWith: "finish" });

    const response = await chat.ask("Clean up", { endWith: null });

    expect(String(response)).toBe("Nothing to clean.");
  });

  it("is satisfied by a tool that halts the loop", async () => {
    class HaltingFinish extends Tool<Record<string, never>> {
      name = "finish";
      description = "Report the verdict";
      schema = z.object({});
      async execute() {
        return this.halt("Verdict recorded.");
      }
    }
    const provider = new ScriptedProvider([call("finish")]);
    const chat = new Chat(provider, "test-model", { tools: [HaltingFinish], endWith: "finish" });

    const response = await chat.ask("Test the page");

    expect(String(response)).toBe("Verdict recorded.");
    expect(provider.requests).toHaveLength(1);
  });

  it("works when streaming", async () => {
    const provider = new ScriptedProvider([text("Looks fine."), call("finish"), text("Passed.")]);
    const chat = new Chat(provider, "test-model", { tools, endWith: "finish" });

    let content = "";
    for await (const chunk of chat.stream("Test the page")) content += chunk.content;

    expect(content).toBe("Looks fine.Passed.");
    expect(lastUserMessage(provider.requests[1])).toMatch(/without calling the finish tool/);
  });

  it("throws when streaming and the model still doesn't call it", async () => {
    const provider = new ScriptedProvider([text("Looks fine."), text("Still fine.")]);
    const chat = new Chat(provider, "test-model", { tools, endWith: "finish" });

    const drain = async () => {
      for await (const _chunk of chat.stream("Test the page")) void _chunk;
    };

    await expect(drain()).rejects.toBeInstanceOf(EndToolNotCalledError);
  });

  it("is set on an agent", async () => {
    const provider = new ScriptedProvider([text("Looks fine."), call("finish"), text("Passed.")]);
    const Explorer = defineAgent({ model: "test-model", tools, endWith: "finish" });
    const agent = new Explorer({ llm: createLLM({ provider }), assumeModelExists: true });

    const response = await agent.ask("Test the page");

    expect(String(response)).toBe("Passed.");
    expect(provider.requests).toHaveLength(3);
  });
});
