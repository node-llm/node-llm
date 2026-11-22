import { describe, it, expect } from "vitest";
import { createLLM } from "../../../src/llm.js";
import { Agent } from "../../../src/agent/Agent.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import type { RouteStep } from "../../../src/chat/ModelRoute.js";

const PRICES: Record<string, number> = { "main-model": 0.1, "cheap-model": 0.01 };

// Calls click, fill, then check, then answers. Costs depend on the model asked for.
class Steps implements Provider {
  id = "scripted";
  requests: ChatRequest[] = [];
  capabilities = { supportsPromptCaching: () => true } as never;
  private plan = ["click", "fill", "check"];
  defaultModel() {
    return "main-model";
  }
  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.requests.push(request);
    const cost = PRICES[request.model] ?? 0;
    const usage = { input_tokens: 100, output_tokens: 10, total_tokens: 110, cost };
    const tool = this.plan[this.requests.length - 1];
    if (!tool) return { content: "All checked.", usage };
    return {
      content: null,
      usage,
      tool_calls: [
        {
          id: `c${this.requests.length}`,
          type: "function",
          function: { name: tool, arguments: "{}" }
        }
      ]
    };
  }
  async *stream(request: ChatRequest) {
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

const tool = (name: string) => ({
  type: "function" as const,
  function: { name, description: name, parameters: { type: "object", properties: {} } },
  handler: async () => `${name} done`
});

const ROUTINE = new Set(["click", "fill", "select"]);
const route = (step: RouteStep) =>
  step.toolCalls.length > 0 && step.toolCalls.every((call) => ROUTINE.has(call.function.name))
    ? "cheap-model"
    : undefined;

function setup() {
  const provider = new Steps();
  const llm = createLLM({ provider });
  class Explorer extends Agent {
    static override model = "main-model";
    static override assumeModelExists = true;
    static override promptCache = true;
    static override tools = [tool("click"), tool("fill"), tool("check")];
    static override routeModel = route;
  }
  return { provider, llm, Explorer };
}

describe("routeModel", () => {
  it("sends each request to the model the route chooses, the chat's model otherwise", async () => {
    const { provider, llm, Explorer } = setup();
    await new Explorer({ llm }).ask("Explore");
    // Turn 0: main. After click: cheap. After fill: cheap. After check: main.
    expect(provider.requests.map((r) => r.model)).toEqual([
      "main-model",
      "cheap-model",
      "cheap-model",
      "main-model"
    ]);
  });

  it("gives the route the turn, the tool calls just answered and the chat's model", async () => {
    const { llm, Explorer } = setup();
    const steps: Array<Pick<RouteStep, "turn" | "model"> & { tools: string[] }> = [];
    await new Explorer({
      llm,
      routeModel: (step) => {
        steps.push({
          turn: step.turn,
          model: step.model,
          tools: step.toolCalls.map((c) => c.function.name)
        });
        return undefined;
      }
    }).ask("Explore");
    expect(steps).toEqual([
      { turn: 0, model: "main-model", tools: [] },
      { turn: 1, model: "main-model", tools: ["click"] },
      { turn: 2, model: "main-model", tools: ["fill"] },
      { turn: 3, model: "main-model", tools: ["check"] }
    ]);
  });

  it("keeps prompt caching on for every model", async () => {
    const { provider, llm, Explorer } = setup();
    await new Explorer({ llm }).ask("Explore");
    expect(provider.requests.every((r) => r.promptCache === true)).toBe(true);
  });

  it("records each request's model and cost, and the ask's usage by model", async () => {
    const { llm, Explorer } = setup();
    const agent = new Explorer({ llm });
    const turns: string[] = [];
    agent.afterResponse(async (response) => {
      turns.push(`${response.model} ${response.usage.cost}`);
    });
    const response = await agent.ask("Explore");
    expect(turns).toEqual([
      "main-model 0.1",
      "cheap-model 0.01",
      "cheap-model 0.01",
      "main-model 0.1"
    ]);
    expect(response.usageByModel?.["main-model"]).toMatchObject({ total_tokens: 220 });
    expect(response.usageByModel?.["main-model"]?.cost).toBeCloseTo(0.2);
    expect(response.usageByModel?.["cheap-model"]?.cost).toBeCloseTo(0.02);
    expect(response.usage.cost).toBeCloseTo(0.22);
  });

  it("uses the chat's model when no route is set, and usageByModel has just it", async () => {
    const { provider, llm } = setup();
    const chat = llm
      .chat("main-model", { assumeModelExists: true })
      .withTools([tool("click"), tool("fill"), tool("check")]);
    const response = await chat.ask("Explore");
    expect(new Set(provider.requests.map((r) => r.model))).toEqual(new Set(["main-model"]));
    expect(Object.keys(response.usageByModel ?? {})).toEqual(["main-model"]);
  });

  it("routes streamed requests too", async () => {
    const { provider, llm, Explorer } = setup();
    for await (const chunk of new Explorer({ llm }).stream("Explore")) void chunk;
    expect(provider.requests.map((r) => r.model)).toEqual([
      "main-model",
      "cheap-model",
      "cheap-model",
      "main-model"
    ]);
  });
});
