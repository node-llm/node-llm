import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createLLM } from "../../../src/llm.js";
import { Agent } from "../../../src/agent/Agent.js";
import { runAgents, agentsTool } from "../../../src/agent/runAgents.js";
import { CostLimitError } from "../../../src/errors/index.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";
import type { SubagentResponse } from "../../../src/chat/AskFrame.js";

const usage = () => ({ input_tokens: 10, output_tokens: 5, total_tokens: 15, cost: 0.01 });

// Behaves by the system prompt: "Answer", "Json", "Fail", "Slow" (waits until cancelled) and
// "Fan <json>" (calls run_agents with those tasks, then repeats the tool result).
class ScriptedProvider implements Provider {
  id = "scripted";
  running = 0;
  mostAtOnce = 0;
  defaultModel() {
    return "test-model";
  }
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const system = String(request.messages.find((m) => m.role === "system")?.content ?? "");
    const last = request.messages[request.messages.length - 1];
    const task = String(request.messages.find((m) => m.role === "user")?.content ?? "");
    this.running++;
    this.mostAtOnce = Math.max(this.mostAtOnce, this.running);
    try {
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (system === "Fail") throw new Error(`could not look at ${task}`);
      if (system === "Slow") {
        await new Promise((_, reject) => {
          const signal = (request as { signal?: AbortSignal }).signal;
          signal?.addEventListener("abort", () => reject(signal.reason ?? new Error("aborted")));
        });
      }
      if (system === "Json")
        return { content: JSON.stringify({ area: task, found: 2 }), usage: usage() };
      if (system.startsWith("Fan ") && last?.role !== "tool") {
        return {
          content: null,
          usage: usage(),
          tool_calls: [
            {
              id: "fan",
              type: "function",
              function: { name: "run_agents", arguments: system.slice(4) }
            }
          ]
        };
      }
      if (last?.role === "tool") return { content: String(last.content), usage: usage() };
      return { content: `looked at ${task}`, usage: usage() };
    } finally {
      this.running--;
    }
  }
  formatToolResultMessage(toolCallId: string, content: string): Message {
    return { role: "tool", tool_call_id: toolCallId, content };
  }
}

function setup() {
  const provider = new ScriptedProvider();
  const llm = createLLM({ provider });
  const make = (instructions: string, extra: Record<string, unknown> = {}) =>
    class extends Agent {
      static override model = "test-model";
      static override instructions = instructions;
      static override assumeModelExists = true;
      static override agentName = instructions.toLowerCase();
      static override schema = extra.schema as never;
    };
  return { provider, llm, make };
}

describe("runAgents", () => {
  it("runs each job in its own conversation, at most `concurrency` at once, in order", async () => {
    const { provider, llm, make } = setup();
    const Look = make("Answer");
    const run = await runAgents(
      ["checkout", "account", "search"].map((area) => ({ agent: Look, task: area })),
      { concurrency: 2, llm }
    );
    expect(run.results.map((r) => [r.name, r.status, r.content])).toEqual([
      ["answer_1", "done", "looked at checkout"],
      ["answer_2", "done", "looked at account"],
      ["answer_3", "done", "looked at search"]
    ]);
    expect(provider.mostAtOnce).toBe(2);
    expect(run.results[0]!.usage.total_tokens).toBe(15);
    expect(run.results[0]!.cost).toBeCloseTo(0.01);
    expect(run.cost).toBeCloseTo(0.03);
  });

  it("returns each worker's answer parsed by its schema as data", async () => {
    const { llm, make } = setup();
    const Look = make("Json", { schema: z.object({ area: z.string(), found: z.number() }) });
    const run = await runAgents([{ agent: Look, task: "checkout", name: "checkout" }], { llm });
    expect(run.results[0]).toMatchObject({
      name: "checkout",
      data: { area: "checkout", found: 2 }
    });
  });

  it("reports a failed worker and lets the others finish", async () => {
    const { llm, make } = setup();
    const run = await runAgents(
      [
        { agent: make("Answer"), task: "checkout" },
        { agent: make("Fail"), task: "account" },
        { agent: make("Answer"), task: "search" }
      ],
      { llm }
    );
    expect(run.results.map((r) => r.status)).toEqual(["done", "failed", "done"]);
    expect(run.results[1]!.error?.message).toContain("could not look at account");
  });

  it("with failFast, cancels the other workers once one fails", async () => {
    const { llm, make } = setup();
    const run = await runAgents(
      [
        { agent: make("Slow"), task: "checkout" },
        { agent: make("Fail"), task: "account" },
        { agent: make("Answer"), task: "search" }
      ],
      { llm, failFast: true, concurrency: 2 }
    );
    expect(run.results.map((r) => r.status)).toEqual(["cancelled", "failed", "cancelled"]);
  });

  it("cancels every worker when its signal is aborted", async () => {
    const { llm, make } = setup();
    const controller = new AbortController();
    setTimeout(() => controller.abort(new Error("lead stopped")), 20);
    const run = await runAgents(
      [
        { agent: make("Slow"), task: "a" },
        { agent: make("Slow"), task: "b" }
      ],
      { llm, signal: controller.signal }
    );
    expect(run.results.map((r) => r.status)).toEqual(["cancelled", "cancelled"]);
  });

  it("stops a worker at its own maxCost", async () => {
    const { llm, make } = setup();
    const Fan = make(`Fan ${JSON.stringify({ tasks: [{ agent: "answer", task: "x" }] })}`);
    // A worker that is itself a lead: its first request costs 0.01, its own limit is 0.005.
    const run = await runAgents([{ agent: Fan, task: "go", maxCost: 0.005 }], {
      llm
    });
    expect(run.results[0]!.status).toBe("failed");
    expect(run.results[0]!.error).toBeInstanceOf(CostLimitError);
  });

  it("stops the workers once all of them together reach the run's maxCost", async () => {
    const { llm, make } = setup();
    const Look = make("Answer");
    const run = await runAgents(
      ["a", "b", "c"].map((task) => ({ agent: Look, task })),
      { llm, concurrency: 1, maxCost: 0.015 }
    );
    expect(run.results.map((r) => r.status)).toEqual(["done", "done", "failed"]);
    expect(run.results[2]!.error).toBeInstanceOf(CostLimitError);
  });
});

describe("agentsTool", () => {
  const fan = (tasks: unknown[]) => `Fan ${JSON.stringify({ tasks })}`;

  it("lets a lead send workers and get their results back as JSON", async () => {
    const { llm, make } = setup();
    const Look = make("Answer");
    const Lead = make(
      fan([
        { agent: "look", task: "checkout" },
        { agent: "look", task: "account" }
      ])
    );
    Lead.tools = [agentsTool({ agents: { look: Look }, llm })];
    const lead = new Lead({ llm });
    const response = await lead.ask("Look at the app");
    const results = JSON.parse(String(response));
    expect(results).toEqual([
      { name: "look_1", agent: "look", status: "done", content: "looked at checkout", cost: 0.01 },
      { name: "look_2", agent: "look", status: "done", content: "looked at account", cost: 0.01 }
    ]);
    // The lead's usage covers its own two requests and the workers' two.
    expect(response.usage.cost).toBeCloseTo(0.04);
  });

  it("the lead's maxCost covers the whole tree", async () => {
    const { llm, make } = setup();
    const Look = make("Answer");
    const Lead = make(fan(["a", "b", "c"].map((task) => ({ agent: "look", task }))));
    Lead.tools = [agentsTool({ agents: { look: Look }, llm, concurrency: 1 })];
    // Lead 0.01 + first worker 0.01 reaches 0.02: the rest are refused before they start.
    const lead = new Lead({ llm, maxCost: 0.02 });
    const results = JSON.parse(String(await lead.ask("Look")));
    expect(results.map((r: { status: string }) => r.status)).toEqual(["done", "failed", "failed"]);
    expect(results[1].error).toMatch(/cost limit/i);
  });

  it("the lead's hooks see each worker's request, and can stop them", async () => {
    const { llm, make } = setup();
    const Look = make("Answer");
    const Lead = make(fan(["a", "b"].map((task) => ({ agent: "look", task }))));
    Lead.tools = [agentsTool({ agents: { look: Look }, llm, concurrency: 1 })];
    const lead = new Lead({ llm });
    const seen: SubagentResponse[] = [];
    lead.afterSubagentResponse((response) => {
      seen.push(response);
    });
    let requests = 0;
    lead.beforeSubagentRequest(() => {
      if (++requests > 1) throw new Error("spending limit reached");
    });
    const results = JSON.parse(String(await lead.ask("Look")));
    expect(results.map((r: { status: string }) => r.status)).toEqual(["done", "failed"]);
    expect(results[1].error).toBe("spending limit reached");
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ model: "test-model", provider: "scripted", depth: 1 });
    expect(seen[0]!.usage.cost).toBeCloseTo(0.01);
  });

  it("refuses an agent it wasn't given", async () => {
    const { llm, make } = setup();
    const Lead = make(fan([{ agent: "other", task: "x" }]));
    Lead.tools = [agentsTool({ agents: { look: make("Answer") }, llm })];
    const response = await new Lead({ llm }).ask("Look");
    expect(String(response)).toMatch(/other|look/);
  });

  it("counts the workers in the lead's totalUsage and usageByModel", async () => {
    const { llm, make } = setup();
    const Look = make("Answer");
    Look.model = "worker-model";
    const Lead = make(
      fan([
        { agent: "look", task: "checkout" },
        { agent: "look", task: "account" }
      ])
    );
    Lead.tools = [agentsTool({ agents: { look: Look }, llm })];
    const lead = new Lead({ llm });
    const response = await lead.ask("Look at the app");

    // Two lead requests and two worker requests, 0.01 each.
    expect(lead.totalUsage.cost).toBeCloseTo(0.04);
    expect(lead.totalUsage.total_tokens).toBe(60);
    expect(response.usageByModel?.["test-model"]?.cost).toBeCloseTo(0.02);
    expect(response.usageByModel?.["worker-model"]?.cost).toBeCloseTo(0.02);
    expect(response.usageByModel?.["worker-model"]?.total_tokens).toBe(30);

    // A second ask adds to the total, and its usage is its own.
    const again = await lead.ask("Look again");
    expect(again.usage.cost).toBeCloseTo(0.04);
    expect(lead.totalUsage.cost).toBeCloseTo(0.08);
  });
});
