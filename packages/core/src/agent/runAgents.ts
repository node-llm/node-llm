import { askFrames, type AskFrame } from "../chat/AskFrame.js";
import type { ChatOptions } from "../chat/ChatOptions.js";
import type { ToolDefinition } from "../chat/Tool.js";
import { ConfigurationError } from "../errors/index.js";
import type { NodeLLMCore } from "../llm.js";
import type { Usage } from "../providers/Provider.js";
import type { Agent, AgentConfig } from "./Agent.js";

/** An agent class, as passed to runAgents() and agentsTool(). */
export type AgentClass = (new (
  overrides?: Partial<AgentConfig<any> & ChatOptions>
) => Agent<any, any>) & {
  agentName?: string;
  description?: string;
  inputs?: string[];
  name: string;
};

/** One worker for runAgents(): an agent class and the task it is given. */
export interface AgentJob {
  agent: AgentClass;
  /** The task, written to stand on its own: the worker can't see the lead's conversation. */
  task: string;
  /** A label for the result. Defaults to the agent's name and its place in the list. */
  name?: string;
  /** The agent's inputs */
  inputs?: Record<string, unknown>;
  /** The most this worker may spend, in US dollars */
  maxCost?: number;
  /** Other settings for this worker, such as `model` or `tools` */
  options?: Partial<AgentConfig<any> & ChatOptions>;
}

export interface RunAgentsOptions {
  /** How many workers run at once. Default 4. */
  concurrency?: number;
  /**
   * Cancel the other workers as soon as one fails. Off by default: a failed worker is reported
   * in its result and the others carry on.
   */
  failFast?: boolean;
  /** Cancels every worker. Workers are also cancelled when the ask they were started from is. */
  signal?: AbortSignal;
  /** The most all the workers together may spend, in US dollars */
  maxCost?: number;
  /** The NodeLLM instance the workers run on, as for Agent.toTool() */
  llm?: NodeLLMCore;
}

/** What one worker did. */
export interface AgentResult<D = unknown> {
  name: string;
  task: string;
  /** done: it answered. failed: it threw. cancelled: it was stopped before it finished. */
  status: "done" | "failed" | "cancelled";
  /** Its final answer */
  content?: string;
  /** Its final answer parsed by its schema, as `response.data` */
  data?: D;
  /** What its requests used, its own subagents included, whether it finished or not */
  usage: Usage;
  /** Its cost in US dollars, 0 when its model's price isn't known */
  cost: number;
  error?: Error;
}

export interface AgentsRun<D = unknown> {
  /** One result per job, in the order given */
  results: AgentResult<D>[];
  /** What all the workers used together */
  usage: Usage;
  cost: number;
}

const DEFAULT_CONCURRENCY = 4;

function emptyUsage(): Usage {
  return { input_tokens: 0, output_tokens: 0, total_tokens: 0 };
}

function snakeCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .toLowerCase();
}

function agentLabel(agent: AgentClass): string {
  return agent.agentName ?? snakeCase(agent.name || "agent");
}

/**
 * Runs several agents at once, each on its own task in its own conversation, and returns what
 * each one found: a lead agent's tool can send workers to look at different areas and merge
 * their answers.
 *
 * Started from a tool of an ask (or an agent), the workers are that ask's subagents: what they
 * spend counts toward its `usage` and `maxCost`, they stop when it reaches its limit or is
 * cancelled, and its beforeSubagentRequest and afterSubagentResponse hooks see their requests
 * (with @node-llm/orm, a store's `{ stop }` stops them too). One failing worker doesn't stop the
 * others unless `failFast` is set.
 *
 * @example
 * const run = await runAgents(
 *   [
 *     { agent: LookAgent, task: "Look at the checkout pages", inputs: { area: "checkout" } },
 *     { agent: LookAgent, task: "Look at the account pages", inputs: { area: "account" } }
 *   ],
 *   { concurrency: 2, maxCost: 1 }
 * );
 * for (const result of run.results) console.log(result.name, result.status, result.data);
 */
export async function runAgents<D = unknown>(
  jobs: AgentJob[],
  options: RunAgentsOptions = {}
): Promise<AgentsRun<D>> {
  const concurrency = Math.max(1, Math.floor(options.concurrency ?? DEFAULT_CONCURRENCY));
  const parent = askFrames.getStore();
  const failFast = new AbortController();
  const signals = [failFast.signal, options.signal, parent?.signal].filter(
    (signal): signal is AbortSignal => Boolean(signal)
  );
  const signal = signals.length === 1 ? signals[0]! : AbortSignal.any(signals);

  // The workers' group: their spending adds up here, under the ask they were started from.
  const group: AskFrame = {
    depth: parent?.depth ?? 0,
    parent,
    maxCost: options.maxCost,
    signal,
    usage: emptyUsage(),
    group: true
  };

  const results: AgentResult<D>[] = new Array(jobs.length);
  let next = 0;

  const runJob = async (index: number): Promise<void> => {
    const job = jobs[index]!;
    const name = job.name ?? `${agentLabel(job.agent)}_${index + 1}`;
    const own: AskFrame = {
      depth: group.depth,
      parent: group,
      signal,
      usage: emptyUsage(),
      group: true
    };
    const finish = (result: Omit<AgentResult<D>, "name" | "task" | "usage" | "cost">) => {
      results[index] = {
        name,
        task: job.task,
        ...result,
        usage: own.usage!,
        cost: own.usage!.cost ?? 0
      };
    };

    if (signal.aborted) return finish({ status: "cancelled", error: abortError(signal) });
    try {
      const agent = new job.agent({
        ...(options.llm ? { llm: options.llm } : {}),
        ...job.options,
        ...(job.maxCost !== undefined ? { maxCost: job.maxCost } : {}),
        ...(job.inputs ? { inputs: job.inputs } : {})
      });
      const response = await agent.ask(job.task, { parentAsk: own, signal });
      finish({ status: "done", content: response.content ?? "", data: response.data as D });
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      // Stopped by a cancellation or another worker's failure, not by its own error.
      const cancelled = signal.aborted;
      finish({ status: cancelled ? "cancelled" : "failed", error: failure });
      if (!cancelled && options.failFast) failFast.abort(failure);
    }
  };

  const worker = async () => {
    while (next < jobs.length) await runJob(next++);
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));

  return { results, usage: group.usage!, cost: group.usage!.cost ?? 0 };
}

function abortError(signal: AbortSignal): Error {
  const reason = signal.reason;
  return reason instanceof Error ? reason : new Error("Cancelled");
}

export interface AgentsToolOptions extends Omit<RunAgentsOptions, "signal"> {
  /** The agents the model may send, by the name it uses for them */
  agents: Record<string, AgentClass>;
  /** Tool name. Default "run_agents". */
  name?: string;
  description?: string;
  /** The most workers one call may start. Default 4. */
  maxTasks?: number;
}

/**
 * A tool that lets the model send several agents at once, each on its own task, and get back
 * what each found as JSON: `[{ name, agent, status, content, data, cost, error }]`. See
 * runAgents() for limits, cancellation and failures.
 *
 * @example
 * class LeadAgent extends Agent {
 *   static tools = [agentsTool({ agents: { look: LookAgent }, concurrency: 3, maxTasks: 4 })];
 * }
 */
export function agentsTool(options: AgentsToolOptions): ToolDefinition {
  const names = Object.keys(options.agents);
  if (names.length === 0) {
    throw new ConfigurationError("[agentsTool] Give at least one agent in `agents`.");
  }
  const maxTasks = Math.max(1, options.maxTasks ?? DEFAULT_CONCURRENCY);
  const name = options.name ?? "run_agents";
  const list = names
    .map((key) => {
      const description = options.agents[key]!.description;
      return description ? `${key}: ${description}` : key;
    })
    .join("; ");

  return {
    type: "function",
    function: {
      name,
      description:
        options.description ??
        `Sends up to ${maxTasks} agents at once, each on its own task in its own conversation, ` +
          `and returns what each one found. Agents: ${list}.`,
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            minItems: 1,
            maxItems: maxTasks,
            items: {
              type: "object",
              properties: {
                agent: { type: "string", enum: names },
                task: {
                  type: "string",
                  description:
                    "The task, written to stand on its own: the agent can't see this conversation."
                },
                inputs: {
                  type: "object",
                  description: "Inputs for the agent, if it takes any",
                  additionalProperties: { type: "string" }
                }
              },
              required: ["agent", "task"],
              additionalProperties: false
            }
          }
        },
        required: ["tasks"],
        additionalProperties: false
      }
    },
    handler: async (args: {
      tasks?: Array<{ agent: string; task: string; inputs?: Record<string, unknown> }>;
    }) => {
      const tasks = (args?.tasks ?? []).slice(0, maxTasks);
      const jobs: AgentJob[] = tasks.map((task, index) => {
        const agent = options.agents[task.agent];
        if (!agent)
          throw new Error(`Unknown agent "${task.agent}". Use one of: ${names.join(", ")}.`);
        const open = agent.inputs;
        const inputs = task.inputs
          ? Object.fromEntries(
              Object.entries(task.inputs).filter(([key]) => !open || open.includes(key))
            )
          : undefined;
        return { agent, task: task.task, inputs, name: `${task.agent}_${index + 1}` };
      });
      const run = await runAgents(jobs, options);
      return JSON.stringify(
        run.results.map((result, index) => ({
          name: result.name,
          agent: tasks[index]!.agent,
          status: result.status,
          ...(result.content !== undefined ? { content: result.content } : {}),
          ...(result.data !== undefined && result.data !== null ? { data: result.data } : {}),
          cost: result.cost,
          ...(result.error ? { error: result.error.message.slice(0, 500) } : {})
        }))
      );
    }
  };
}
