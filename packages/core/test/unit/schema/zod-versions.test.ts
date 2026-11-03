import { describe, it, expect, expectTypeOf } from "vitest";
import { z as zod4 } from "zod";
import * as zodMini from "zod/mini";
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
          nickname: { type: ["string", "null"] }
        },
        required: ["name", "age", "nickname"]
      });
      expect(response.data).toEqual({ name: "Ada", age: 36, nickname: null, active: true });
      expectTypeOf(response.data).toEqualTypeOf<zod4.infer<typeof Person>>();
    });

    // OpenAPI's `nullable` is ignored or rejected by providers, so models answered "null" as text.
    it("sends nullable fields and objects in standard JSON Schema, without a $schema line", () => {
      const json = toJsonSchema(
        zod4.object({
          ref: zod4.string().nullable(),
          opens: zod4.object({ ref: zod4.string() }).nullable()
        })
      );

      expect(json).not.toHaveProperty("$schema");
      expect(JSON.stringify(json)).not.toContain("nullable");
      expect(json.properties).toEqual({
        ref: { type: ["string", "null"] },
        opens: {
          anyOf: [
            {
              type: "object",
              properties: { ref: { type: "string" } },
              required: ["ref"]
            },
            { type: "null" }
          ]
        }
      });
    });

    it("sends a nullable Zod 3 field in standard JSON Schema", () => {
      const json = toJsonSchema(z.object({ ref: z.string().nullable() }));

      expect(json).not.toHaveProperty("$schema");
      expect(json.properties).toEqual({ ref: { type: ["string", "null"] } });
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

    it("describes a nullable tool argument in standard JSON Schema", () => {
      class PickTool extends Tool<{ ref: string | null }> {
        name = "pick";
        description = "Picks an element, or none";
        schema = zod4.object({ ref: zod4.string().nullable() });
        async execute() {
          return "ok";
        }
      }

      expect(new PickTool().toLLMTool().function.parameters).toMatchObject({
        properties: { ref: { type: ["string", "null"] } }
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
