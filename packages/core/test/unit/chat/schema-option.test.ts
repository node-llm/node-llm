import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Chat } from "../../../src/chat/Chat.js";
import { Schema } from "../../../src/schema/Schema.js";
import { FakeProvider } from "../../fake-provider.js";

/**
 * A schema passed as the `schema` chat option used to be stored as-is, and the
 * request builder then read `.definition` off a Zod object and crashed. It is
 * now converted the same way withSchema() converts it.
 */
describe("the schema chat option", () => {
  const answer = {
    content: '{"age":30}',
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
  };

  it("accepts a Zod schema", async () => {
    const provider = new FakeProvider([answer]);
    const response = await new Chat(provider, "fake-model", {
      schema: z.object({ age: z.number() }) as any
    }).ask("Get age");

    expect(response.data).toEqual({ age: 30 });
    expect(provider.lastRequest?.response_format?.type).toBe("json_schema");
  });

  it("accepts a plain JSON schema", async () => {
    const provider = new FakeProvider([answer]);
    const jsonSchema = {
      type: "object",
      properties: { age: { type: "number" } },
      required: ["age"]
    };
    const response = await new Chat(provider, "fake-model", { schema: jsonSchema as any }).ask(
      "Get age"
    );

    expect(response.data).toEqual({ age: 30 });
  });

  it("still accepts a Schema instance unchanged", async () => {
    const provider = new FakeProvider([answer]);
    const schema = Schema.fromZod("output", z.object({ age: z.number() }));
    const response = await new Chat(provider, "fake-model", { schema }).ask("Get age");

    expect(response.data).toEqual({ age: 30 });
  });

  it("leaves an object already shaped like a Schema untouched", async () => {
    // Structural typing lets callers pass { definition } without the class;
    // wrapping it again would bury the real schema one level down.
    const provider = new FakeProvider([answer]);
    const shaped = { definition: { name: "Age", schema: z.object({ age: z.number() }) } };
    const response = await new Chat(provider, "fake-model", { schema: shaped as any }).ask(
      "Get age"
    );

    expect(response.data).toEqual({ age: 30 });
  });

  it("still validates the model's output against a Zod schema", async () => {
    const provider = new FakeProvider([{ ...answer, content: '{"age":"thirty"}' }]);
    const response = await new Chat(provider, "fake-model", {
      schema: z.object({ age: z.number() }) as any
    }).ask("Get age");

    expect(() => response.data).toThrow();
  });
});
