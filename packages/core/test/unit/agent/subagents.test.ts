import { describe, it, expect, beforeEach } from "vitest";
import { createLLM } from "../../../src/llm.js";
import { Agent, defineAgent } from "../../../src/agent/Agent.js";
import { providerRegistry } from "../../../src/providers/registry.js";
import { FakeProvider } from "../../fake-provider.js";
import { ConfigurationError } from "../../../src/errors/index.js";

function callTool(name: string, args: Record<string, unknown>) {
  return {
    content: null,
    tool_calls: [
      {
        id: "call_1",
        type: "function" as const,
        function: { name, arguments: JSON.stringify(args) }
      }
    ]
  };
}

describe("subagents", () => {
  let parent: FakeProvider;
  let sub: FakeProvider;

  beforeEach(() => {
    parent = new FakeProvider();
    sub = new FakeProvider();
    providerRegistry.register("parent", () => parent);
    providerRegistry.register("sub", () => sub);
  });

  class ResearchAgent extends Agent {
    static override model = "sub-model";
    static override provider = "sub";
    static override description = "Researches a question and reports back";
    static override instructions = "Cite every source.";
  }

  it("describes an agent as a tool", () => {
    const tool = ResearchAgent.toTool();
    expect(tool.function.name).toBe("research_agent");
    expect(tool.function.description).toBe("Researches a question and reports back");
    expect(tool.function.parameters).toMatchObject({ required: ["task"] });
  });

  it("runs the agent in its own conversation and returns only its answer", async () => {
    parent.replies.push(
      callTool("research_agent", { task: "Find the refund policy" }),
      "Refunds take 5 days."
    );
    sub.replies.push("Policy: 5 business days [doc-12]");

    class SupportAgent extends Agent {
      static override model = "parent-model";
      static override tools = [ResearchAgent];
    }
    const llm = createLLM({ provider: "parent" });
    const response = await new SupportAgent({ llm }).ask("How long do refunds take?");

    expect(String(response)).toBe("Refunds take 5 days.");
    // The subagent saw only the task, under its own instructions.
    const subMessages = sub.lastRequest!.messages;
    expect(subMessages.map((m) => m.content)).toEqual([
      "Cite every source.",
      "Find the refund policy"
    ]);
    // Only its answer came back to the parent.
    const toolResult = parent.lastRequest!.messages.find((m) => m.role === "tool");
    expect(toolResult?.content).toBe("Policy: 5 business days [doc-12]");
  });

  it("lets the model fill inputs that toTool does not fix", async () => {
    class BillingAgent extends Agent<{ customer: string; region: string }> {
      static override model = "sub-model";
      static override provider = "sub";
      static override inputs = ["customer", "region"];
      static override instructions = (i: Record<string, string>) =>
        `Customer ${i.customer} in ${i.region}`;
    }
    const tool = BillingAgent.toTool({ customer: "c_42" }, { llm: createLLM() });
    expect(Object.keys((tool.function.parameters as { properties: object }).properties)).toEqual([
      "task",
      "region"
    ]);

    sub.replies.push("Refunded");
    const result = await tool.handler!({
      task: "Refund the last order",
      region: "EU",
      customer: "ignored"
    });

    expect(result).toBe("Refunded");
    expect(sub.lastRequest!.messages[0]!.content).toBe("Customer c_42 in EU");
  });

  it("needs a name for an anonymous defined agent", () => {
    const Anonymous = defineAgent({ model: "m" });
    expect(() => Anonymous.toTool()).toThrow(ConfigurationError);
    const Named = defineAgent({ model: "m", name: "summarizer", description: "Summarizes" });
    expect(Named.toTool().function.name).toBe("summarizer");
  });
});
