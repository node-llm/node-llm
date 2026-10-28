import { describe, it, expect, expectTypeOf } from "vitest";
import { z as zod4 } from "zod4";
import { z as zod3FromAnotherCopy } from "zod4/v3";
import * as zodMini from "zod4/mini";
import { Chat } from "../../../src/chat/Chat.js";
import { Tool } from "../../../src/chat/Tool.js";
import { defineAgent } from "../../../src/agent/Agent.js";
import { createLLM } from "../../../src/llm.js";
import { providerRegistry } from "../../../src/providers/registry.js";
import { toJsonSchema } from "../../../src/schema/to-json-schema.js";
import { z } from "../../../src/index.js";
import { FakeProvider } from "../../fake-provider.js";

const Person = zod4.object({
  name: zod4.string().describe("Full name"),
  age: zod4.number().int(),
  nickname: zod4.string().nullable(),
  active: zod4.boolean().default(true)
});

describe("Zod 4 and Zod 3 schemas", () => {
  describe("structured output", () => {
    it("sends a Zod 4 schema as JSON Schema and parses the response with it", async () => {
      const provider = new FakeProvider(['{"name":"Ada","age":36,"nickname":null}']);

      const response = await new Chat(provider, "fake-model").withSchema(Person).ask("Who?");

      expect(provider.lastRequest?.response_format?.json_schema?.schema).toMatchObject({
        type: "object",
        properties: {
          name: { type: "string", description: "Full name" },
          age: { type: "integer" },
          nickname: { type: "string", nullable: true }
        },
        required: ["name", "age", "nickname"]
      });
      expect(response.data).toEqual({ name: "Ada", age: 36, nickname: null, active: true });
      expectTypeOf(response.data).toEqualTypeOf<zod4.infer<typeof Person>>();
    });

    it("throws Zod's own error when the response doesn't match a Zod 4 schema", async () => {
      const provider = new FakeProvider(['{"name":"Ada"}']);

      const response = await new Chat(provider, "fake-model").withSchema(Person).ask("Who?");

      expect(() => response.data).toThrow(zod4.ZodError);
      expect(response.isValid).toBe(false);
    });

    it("sends a Zod 3 schema the same way as before", async () => {
      const provider = new FakeProvider(['{"name":"Ada"}']);

      await new Chat(provider, "fake-model").withSchema(z.object({ name: z.string() })).ask("Who?");

      expect(provider.lastRequest?.response_format?.json_schema?.schema).toEqual({
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
        additionalProperties: false
      });
    });

    it("accepts a Zod 3 schema from another copy of Zod", async () => {
      const provider = new FakeProvider(['{"name":"Ada"}']);
      const schema = zod3FromAnotherCopy.object({ name: zod3FromAnotherCopy.string() });

      const response = await new Chat(provider, "fake-model").withSchema(schema).ask("Who?");

      expect(provider.lastRequest?.response_format?.json_schema?.schema).toMatchObject({
        properties: { name: { type: "string" } }
      });
      expect(response.data).toEqual({ name: "Ada" });
    });
  });

  describe("tools", () => {
    class LookupTool extends Tool<zod4.infer<typeof LookupTool.args>> {
      static args = zod4.object({ query: zod4.string().describe("What to look up") });
      name = "lookup";
      description = "Looks something up";
      schema = LookupTool.args;
      async execute({ query }: zod4.infer<typeof LookupTool.args>) {
        return `found ${query}`;
      }
    }

    it("describes a Zod 4 tool schema to the model", () => {
      expect(new LookupTool().toLLMTool().function.parameters).toMatchObject({
        type: "object",
        properties: { query: { type: "string", description: "What to look up" } },
        required: ["query"]
      });
    });

    it("validates tool arguments with a Zod 4 schema", async () => {
      const tool = new LookupTool();

      expect(await tool.handler({ query: "pens" })).toBe("found pens");
      expect(await tool.handler({ query: 4 } as never)).toContain("Invalid tool arguments");
    });
  });

  it("types defineAgent() output from a Zod 4 schema", async () => {
    const provider = new FakeProvider(['{"name":"Ada","age":36,"nickname":null}']);
    providerRegistry.register("zod-versions-fake", () => provider);
    const PersonAgent = defineAgent({ model: "fake-model", schema: Person });

    const result = await new PersonAgent({ llm: createLLM({ provider: "zod-versions-fake" }) }).ask(
      "Who?"
    );

    expect(result.data.name).toBe("Ada");
    expectTypeOf(result.data).toEqualTypeOf<zod4.infer<typeof Person>>();
  });

  it("explains that zod/mini schemas can't be described to a model", () => {
    expect(() => toJsonSchema(zodMini.object({ name: zodMini.string() }))).toThrow(
      'Zod 4 schemas need Zod 4.2 or later, imported from "zod" rather than "zod/mini"'
    );
  });
});
