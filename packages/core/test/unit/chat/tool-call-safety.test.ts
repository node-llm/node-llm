import { describe, it, expect } from "vitest";
import { z } from "zod";
import { ToolHandler } from "../../../src/chat/ToolHandler.js";
import { Tool, ToolDefinition, ToolCall, defineTool } from "../../../src/chat/Tool.js";
import { checkArguments } from "../../../src/schema/check-arguments.js";
import { toolErrorText } from "../../../src/chat/ToolErrorText.js";

const call = (name: string, args: unknown): ToolCall => ({
  id: "c1",
  type: "function",
  function: { name, arguments: JSON.stringify(args) }
});

const received: unknown[] = [];
const refund: ToolDefinition = {
  type: "function",
  function: {
    name: "refund",
    parameters: {
      type: "object",
      properties: {
        orderId: { type: "string" },
        amount: { type: "number" },
        reason: { type: "string", enum: ["damaged", "late"] }
      },
      required: ["orderId", "amount"]
    }
  },
  handler: async (args) => {
    received.push(args);
    return "refunded";
  }
};

describe("JSON Schema tools", () => {
  it("run with arguments that match, extra fields included when the schema allows them", async () => {
    const result = await ToolHandler.execute(
      call("refund", { orderId: "A1", amount: 5, note: "thanks" }),
      [refund]
    );
    expect(result.content).toBe("refunded");
  });

  it("never reach the handler with arguments the schema rules out", async () => {
    received.length = 0;
    const result = await ToolHandler.execute(call("refund", { orderId: 12, reason: "angry" }), [
      refund
    ]);

    expect(received).toEqual([]);
    expect(result.content).toBe(
      'Invalid tool arguments: amount is required; orderId must be string, got number; reason must be one of "damaged", "late"'
    );
  });

  it("refuse extra fields when additionalProperties is false", async () => {
    const strict = {
      ...refund,
      function: {
        ...refund.function,
        parameters: { ...refund.function.parameters, additionalProperties: false }
      }
    };
    const result = await ToolHandler.execute(
      call("refund", { orderId: "A1", amount: 5, admin: true }),
      [strict]
    );
    expect(result.content).toBe("Invalid tool arguments: admin is not allowed");
  });

  it("are checked for Tool classes with a JSON Schema, such as MCP tools", async () => {
    class Lookup extends Tool<{ id: string }> {
      name = "lookup";
      description = "Look up";
      schema = { type: "object", properties: { id: { type: "string" } }, required: ["id"] };
      async execute() {
        return "found";
      }
    }
    const result = await ToolHandler.execute(call("lookup", {}), [new Lookup().toLLMTool()]);
    expect(result.content).toBe("Invalid tool arguments: id is required");
  });
});

describe("Zod tools", () => {
  it("are left to Zod, so coercions and defaults still work", async () => {
    const Count = defineTool({
      name: "count",
      description: "Count",
      schema: z.object({ n: z.coerce.number(), unit: z.string().default("items") }),
      execute: ({ n, unit }) => `${n} ${unit}`
    });
    const result = await ToolHandler.execute(call("count", { n: "5" }), [new Count().toLLMTool()]);
    expect(result.content).toBe("5 items");
  });
});

describe("checkArguments", () => {
  it("handles nested objects, arrays, nulls and anyOf", () => {
    const schema = {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { type: "object", properties: { qty: { type: "integer" } } }
        },
        note: { type: ["string", "null"] },
        target: { anyOf: [{ type: "string" }, { type: "number" }] }
      }
    };
    expect(checkArguments(schema, { items: [{ qty: 1 }], note: null, target: 3 })).toEqual([]);
    expect(checkArguments(schema, { items: [{ qty: 1.5 }], target: true })).toEqual([
      "items[0].qty must be integer, got number",
      "target matches none of the allowed shapes"
    ]);
  });

  it("ignores keywords it doesn't know", () => {
    expect(
      checkArguments({ type: "object", properties: { a: { format: "email" } } }, { a: "x" })
    ).toEqual([]);
  });
});

describe("what the model is told about tool errors", () => {
  it("masks keys and cuts long messages", () => {
    expect(toolErrorText(new Error("connect failed with sk-proj-abcdefghijklmnopqrstuv"))).toBe(
      "connect failed with [REDACTED]"
    );
    expect(toolErrorText(new Error("x".repeat(2000)))).toHaveLength(503);
    expect(toolErrorText("plain")).toBe("plain");
  });

  it("applies to errors a Tool returns as text", async () => {
    const Broken = defineTool({
      name: "broken",
      description: "Broken",
      schema: z.object({}),
      execute: () => {
        throw new Error(
          "postgres://admin:hunter2@db/app refused key AIzaSyA1234567890abcdefghijklmnopqrstu"
        );
      }
    });
    const result = await ToolHandler.execute(call("broken", {}), [new Broken().toLLMTool()]);
    expect(result.content).toBe(
      "Error executing tool 'broken': postgres://admin:[REDACTED]@db/app refused key [REDACTED]"
    );
  });
});

describe("a call to a tool that doesn't exist", () => {
  it("lists only the tools the model can see, not deferred ones", async () => {
    const hidden = {
      ...refund,
      function: { ...refund.function, name: "delete_account" },
      defer: true
    };
    const result = await ToolHandler.execute(call("nope", {}), [refund, hidden]);
    expect(result.content).toBe(
      "Model tried to call unavailable tool 'nope'. Available tools: [refund]."
    );
  });
});
