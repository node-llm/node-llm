import { describe, it, expect, expectTypeOf } from "vitest";
import { z as zod4 } from "zod4";
import { Chat } from "../../../src/chat/Chat.js";
import { Tool, ToolHalt, defineTool } from "../../../src/chat/Tool.js";
import { z } from "../../../src/index.js";
import { FakeProvider } from "../../fake-provider.js";

const lookupCall = (args: string) => ({
  content: "",
  tool_calls: [
    { id: "call_1", type: "function" as const, function: { name: "lookup", arguments: args } }
  ]
});

describe("defineTool()", () => {
  const LookupTool = defineTool({
    name: "lookup",
    description: "Looks an item up",
    schema: zod4.object({
      item: zod4.string().describe("Item name"),
      limit: zod4.number().optional()
    }),
    execute: async ({ item, limit }) => {
      expectTypeOf(item).toEqualTypeOf<string>();
      expectTypeOf(limit).toEqualTypeOf<number | undefined>();
      return { item, found: true };
    }
  });

  it("creates a Tool class described by its schema", () => {
    const tool = new LookupTool();

    expect(tool).toBeInstanceOf(Tool);
    expect(tool.toLLMTool().function).toMatchObject({
      name: "lookup",
      description: "Looks an item up",
      parameters: {
        type: "object",
        properties: { item: { type: "string", description: "Item name" } },
        required: ["item"]
      }
    });
  });

  it("runs in a chat's tool loop with validated arguments", async () => {
    const provider = new FakeProvider([lookupCall('{"item":"pen"}'), "Found it"]);

    const response = await new Chat(provider, "fake-model").withTool(LookupTool).ask("Find a pen");

    expect(String(response)).toBe("Found it");
    expect(provider.lastRequest?.messages.at(-1)).toMatchObject({
      role: "tool",
      content: '{"item":"pen","found":true}'
    });
  });

  it("reports invalid arguments to the model instead of running", async () => {
    expect(await new LookupTool().handler({ item: 4 } as never)).toContain(
      "Invalid tool arguments"
    );
  });

  it("can end the turn with a ToolHalt", async () => {
    const StopTool = defineTool({
      name: "lookup",
      description: "Stops",
      schema: z.object({ item: z.string() }),
      execute: ({ item }) => new ToolHalt(`Stopped at ${item}`)
    });
    const provider = new FakeProvider([lookupCall('{"item":"pen"}'), "never sent"]);

    const response = await new Chat(provider, "fake-model").withTool(StopTool).ask("Find a pen");

    expect(String(response)).toBe("Stopped at pen");
  });
});
