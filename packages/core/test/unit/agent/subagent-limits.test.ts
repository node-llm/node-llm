import { describe, it, expect } from "vitest";
import { createLLM } from "../../../src/llm.js";
import { Agent } from "../../../src/agent/Agent.js";
import { AgentDepthError, CostLimitError } from "../../../src/errors/index.js";
import { Provider, ChatRequest, ChatResponse } from "../../../src/providers/Provider.js";
import { Message } from "../../../src/chat/Message.js";

const usage = () => ({ input_tokens: 10, output_tokens: 5, total_tokens: 15, cost: 0.01 });

// Answers by the system prompt: "Delegate" agents hand the task on, others answer.
class ScriptedProvider implements Provider {
  id = "scripted";
  requests: ChatRequest[] = [];
  defaultModel() {
    return "test-model";
  }
  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.requests.push(request);
    const system = String(request.messages.find((m) => m.role === "system")?.content ?? "");
    const last = request.messages[request.messages.length - 1];
    if (system.startsWith("Delegate") && last?.role !== "tool") {
      const tool = system.split(" ")[1]!;
      return {
        content: null,
        usage: usage(),
        tool_calls: [
          {
            id: `c${this.requests.length}`,
            type: "function",
            function: { name: tool, arguments: JSON.stringify({ task: "go on" }) }
          }
        ]
      };
    }
    return { content: last?.role === "tool" ? `done: ${last.content}` : "answer", usage: usage() };
  }
  formatToolResultMessage(toolCallId: string, content: string): Message {
    return { role: "tool", tool_call_id: toolCallId, content };
  }
}

describe("subagent limits", () => {
  it("adds a subagent's spending to its parent's usage", async () => {
    const provider = new ScriptedProvider();
    const llm = createLLM({ provider });
    class Researcher extends Agent {
      static override model = "test-model";
      static override instructions = "Answer";
      static override assumeModelExists = true;
    }
    class Lead extends Agent {
      static override model = "test-model";
      static override instructions = "Delegate researcher";
      static override tools = [Researcher.toTool({}, { llm })];
      static override assumeModelExists = true;
    }

    const response = await new Lead({ llm }).ask("Research it");

    expect(String(response)).toBe("done: answer");
    // Two requests of the lead and one of the researcher.
    expect(provider.requests).toHaveLength(3);
    expect(response.usage.total_tokens).toBe(45);
    expect(response.usage.cost).toBeCloseTo(0.03);
  });

  it("stops an agent that keeps handing the task to itself", async () => {
    const provider = new ScriptedProvider();
    const llm = createLLM({ provider });
    class Looper extends Agent {
      static override model = "test-model";
      static override instructions = "Delegate looper";
      static override maxToolCalls = 2;
      static override assumeModelExists = true;
    }
    Looper.tools = [Looper.toTool({}, { llm })];

    const answer = String(await new Looper({ llm }).ask("Go"));

    // The ninth level refuses to start; its parents get the error as a tool result.
    expect(provider.requests.length).toBeLessThan(40);
    expect(answer).toContain("nested more than 8 deep");
  });

  it("throws AgentDepthError when asked directly past the limit", async () => {
    const provider = new ScriptedProvider();
    class Plain extends Agent {
      static override model = "test-model";
      static override assumeModelExists = true;
    }
    let frame: import("../../../src/chat/AskFrame.js").AskFrame | undefined;
    for (let depth = 1; depth <= 8; depth++) frame = { depth, parent: frame };

    await expect(
      new Plain({ llm: createLLM({ provider }) }).ask("hi", { parentAsk: frame })
    ).rejects.toBeInstanceOf(AgentDepthError);
    expect(provider.requests).toHaveLength(0);
  });

  it("stops a subagent once its parent's cost limit is reached", async () => {
    const provider = new ScriptedProvider();
    const llm = createLLM({ provider });
    // The worker hands the task on to itself, so it would keep spending without the parent's limit.
    class Worker extends Agent {
      static override model = "test-model";
      static override instructions = "Delegate worker";
      static override assumeModelExists = true;
    }
    Worker.tools = [Worker.toTool({}, { llm })];
    class Lead extends Agent {
      static override model = "test-model";
      static override instructions = "Delegate worker";
      static override tools = [Worker.toTool({}, { llm })];
      static override maxCost = 0.03;
      static override assumeModelExists = true;
    }

    const answer = String(await new Lead({ llm }).ask("Go"));

    // $0.01 a request: the lead's first, then subagents, until the lead's $0.03 is spent.
    expect(provider.requests.length).toBeLessThanOrEqual(5);
    expect(answer).toContain("Cost limit ($0.03) reached");
  });

  it("leaves a chat with no subagents as it was", async () => {
    const provider = new ScriptedProvider();
    const chat = createLLM({ provider }).chat("test-model", { assumeModelExists: true });
    const response = await chat.ask("Hi");
    expect(response.usage.cost).toBeCloseTo(0.01);
    expect(CostLimitError).toBeDefined();
  });
});
