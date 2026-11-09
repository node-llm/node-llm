import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Tool, ToolHalt, defineTool } from "../../../src/chat/Tool.js";

class NotFound extends Error {}
class SpecificNotFound extends NotFound {}

function failingTool(error: Error, setup?: (tool: LookupTool) => void) {
  class LookupTool extends Tool<{ id: string }> {
    name = "lookup";
    description = "Look up an order";
    schema = z.object({ id: z.string() });
    constructor() {
      super();
      setup?.(this);
    }
    async execute(): Promise<unknown> {
      throw error;
    }
    on<E extends Error>(
      errorClass: abstract new (...args: never[]) => E,
      handler: (error: E, args: { id: string }) => unknown
    ) {
      return this.rescueFrom(errorClass, handler);
    }
  }
  type LookupTool = InstanceType<typeof LookupTool>;
  return new LookupTool();
}

describe("Tool.rescueFrom", () => {
  it("returns the handler result as the tool result, as JSON", async () => {
    const tool = failingTool(new NotFound("gone"), (t) =>
      t.on(NotFound, (error, { id }) => ({ error: `No order ${id}: ${error.message}` }))
    );
    expect(await tool.handler({ id: "42" })).toBe('{"error":"No order 42: gone"}');
  });

  it("matches subclasses and prefers the handler registered last", async () => {
    const tool = failingTool(new SpecificNotFound("x"), (t) => {
      t.on(Error, () => "general");
      t.on(NotFound, () => "specific");
    });
    expect(await tool.handler({ id: "1" })).toBe("specific");
  });

  it("keeps the default message for errors no handler matches", async () => {
    const tool = failingTool(new TypeError("boom"), (t) => t.on(NotFound, () => "handled"));
    expect(await tool.handler({ id: "1" })).toBe("Error executing tool 'lookup': boom");
  });

  it("lets a handler halt the turn", async () => {
    const tool = failingTool(new NotFound("x"), (t) => t.on(NotFound, () => new ToolHalt("stop")));
    const result = await tool.handler({ id: "1" });
    expect(result).toBeInstanceOf(ToolHalt);
  });

  it("reports an error thrown by the handler itself", async () => {
    const tool = failingTool(new NotFound("x"), (t) =>
      t.on(NotFound, () => {
        throw new Error("handler broke");
      })
    );
    expect(await tool.handler({ id: "1" })).toBe("Error executing tool 'lookup': handler broke");
  });

  it("works with defineTool", async () => {
    const Lookup = defineTool({
      name: "lookup",
      description: "Look up an order",
      schema: z.object({ id: z.string() }),
      execute: async () => {
        throw new NotFound("gone");
      },
      rescueFrom: [[NotFound, (_error, { id }) => `No order ${id}`]]
    });
    expect(await new Lookup().handler({ id: "7" })).toBe("No order 7");
  });
});
