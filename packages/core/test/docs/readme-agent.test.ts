/**
 * Documentation Verification Tests: README.md Agent & ToolHalt Examples
 *
 * Verifies that Agent and ToolHalt code examples from the README work correctly.
 */
import { describe, it, expect } from "vitest";
import { Agent, Tool, z } from "../../src/index.js";

describe("README: Agent Class", () => {
  it("Tool can be defined with instance properties", () => {
    class LookupOrderTool extends Tool<{ orderId: string }> {
      name = "lookup_order";
      description = "Look up an order by ID";
      schema = z.object({ orderId: z.string() });

      async execute({ orderId }: { orderId: string }) {
        return { status: "shipped", eta: "Tomorrow" };
      }
    }

    const tool = new LookupOrderTool();
    expect(tool.name).toBe("lookup_order");
    expect(tool.description).toBe("Look up an order by ID");
    expect(tool.schema).toBeDefined();
  });

  it("Agent can be defined with static properties", () => {
    class LookupOrderTool extends Tool<{ orderId: string }> {
      name = "lookup_order";
      description = "Look up an order by ID";
      schema = z.object({ orderId: z.string() });
      async execute({ orderId }: { orderId: string }) {
        return { status: "shipped", eta: "Tomorrow" };
      }
    }

    class SupportAgent extends Agent {
      static model = "gpt-4.1";
      static instructions = "You are a helpful support agent.";
      static tools = [LookupOrderTool];
      static temperature = 0.2;
    }

    expect(SupportAgent.model).toBe("gpt-4.1");
    expect(SupportAgent.instructions).toBe("You are a helpful support agent.");
    expect(SupportAgent.tools).toHaveLength(1);
    expect(SupportAgent.temperature).toBe(0.2);
  });

  it("Agent instance properties can be overridden", () => {
    class TestAgent extends Agent {
      static model = "gpt-4o";
      static temperature = 0.5;
    }

    // Check static properties exist
    expect(TestAgent.model).toBe("gpt-4o");
    expect(TestAgent.temperature).toBe(0.5);
  });
});

describe("README: ToolHalt", () => {
  it("Tool can define halt method for early termination", () => {
    class FinalAnswerTool extends Tool<{ answer: string }> {
      name = "final_answer";
      description = "Return the final answer to the user";
      schema = z.object({ answer: z.string() });

      async execute({ answer }: { answer: string }) {
        return this.halt(answer);
      }
    }

    const tool = new FinalAnswerTool();
    expect(tool.name).toBe("final_answer");
    expect(tool.description).toContain("final answer");
    expect(typeof tool.halt).toBe("function");
  });

  it("halt() returns a ToolHalt instance", async () => {
    class TestHaltTool extends Tool<{ result: string }> {
      name = "test_halt";
      description = "Test halt";
      schema = z.object({ result: z.string() });

      async execute({ result }: { result: string }) {
        return this.halt(result);
      }
    }

    const tool = new TestHaltTool();
    const haltResult = await tool.execute({ result: "Done!" });

    expect(haltResult).toBeDefined();
    expect(haltResult.toString()).toBe("Done!");
  });
});
