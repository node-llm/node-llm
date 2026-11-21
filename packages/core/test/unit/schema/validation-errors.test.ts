import { describe, it, expect } from "vitest";
import { z } from "zod";
import { z as z3 } from "zod/v3";
import { ChatResponseString } from "../../../src/chat/ChatResponse.js";
import { Schema } from "../../../src/schema/Schema.js";
import type { SchemaProblem } from "../../../src/schema/validation.js";
import { SchemaSelfCorrectionMiddleware } from "../../../src/middlewares/SchemaSelfCorrection.js";
import type { MiddlewareContext } from "../../../src/types/Middleware.js";
import { toJsonSchema } from "../../../src/schema/to-json-schema.js";

const usage = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

function respond(content: unknown, schema: Schema) {
  return new ChatResponseString(
    JSON.stringify(content),
    usage,
    "test",
    "test",
    undefined,
    undefined,
    undefined,
    "stop",
    schema
  );
}

type ReadableError = Error & { problems: SchemaProblem[] };

function thrown(fn: () => unknown): ReadableError {
  try {
    fn();
  } catch (error) {
    return error as ReadableError;
  }
  throw new Error("expected a throw");
}

describe("schema validation errors", () => {
  const verdict = z.object({
    status: z.enum(["passed", "failed"]),
    steps: z.array(z.object({ action: z.enum(["click", "fill"]) }))
  });

  it("names the field, the allowed values and the value received, on one line (Zod 4)", () => {
    const response = respond(
      { status: "blocked", steps: [{ action: "click" }, { action: "hover" }] },
      Schema.fromZod("verdict", verdict)
    );

    const error = thrown(() => response.data);

    expect(error).toBeInstanceOf(z.ZodError);
    expect(error.message).not.toContain("\n");
    expect(error.message).toMatch(/^Response did not match the "verdict" schema: status: /);
    expect(error.message).toContain('"passed"');
    expect(error.message).toContain('(got "blocked")');
    expect(error.message).toContain("steps[1].action: ");
    expect(error.message).toContain('(got "hover")');
    expect(error.problems).toEqual([
      expect.objectContaining({
        path: "status",
        expected: ["passed", "failed"],
        received: "blocked"
      }),
      expect.objectContaining({
        path: "steps[1].action",
        expected: ["click", "fill"],
        received: "hover"
      })
    ]);
    expect((error as unknown as z.ZodError).issues).toHaveLength(2);
    expect(response.validationError).toBe(error);
    expect(response.isValid).toBe(false);
  });

  it("says a missing field was left out", () => {
    const error = thrown(() => respond({ steps: [] }, Schema.fromZod("verdict", verdict)).data);

    expect(error.problems[0]).toMatchObject({ path: "status", received: undefined });
    expect(error.message).toMatch(/status: /);
    expect(error.message).not.toContain("(got");
  });

  it("keeps Zod 3's own wording, which already names the value received", () => {
    const schema = z3.object({ status: z3.enum(["passed", "failed"]) });
    const error = thrown(
      () => respond({ status: "blocked" }, Schema.fromZod("verdict", schema)).data
    );

    expect(error).toBeInstanceOf(z3.ZodError);
    expect(error.problems[0]).toMatchObject({
      path: "status",
      expected: ["passed", "failed"],
      received: "blocked"
    });
    expect(error.message).toContain("received 'blocked'");
    expect(error.message).not.toContain("(got");
  });

  it("shortens a long value received", () => {
    const schema = z.object({ count: z.number() });
    const error = thrown(
      () => respond({ count: "x".repeat(200) }, Schema.fromZod("s", schema)).data
    );

    expect(error.message.length).toBeLessThan(200);
    expect(error.message).toContain('received string (got "xxx');
    expect(error.message).toMatch(/\.\.\.\)$/);
  });

  it("leaves an error that is not a validation error as it is", () => {
    const schema = {
      _zod: { output: {} },
      parse: () => {
        throw new TypeError("boom");
      }
    };
    const error = thrown(
      () => respond({}, Schema.fromZod("s", schema as unknown as z.ZodType)).data
    );

    expect(error).toBeInstanceOf(TypeError);
    expect(error.message).toBe("boom");
  });
});

describe("re-asking with the validation error", () => {
  it("tells the model which field was wrong and what it may send", async () => {
    const schema = Schema.fromZod("verdict", z.object({ status: z.enum(["passed", "failed"]) }));
    const context = { options: { schema }, state: {}, provider: "p", model: "m" };

    const directive = await new SchemaSelfCorrectionMiddleware({ maxRetries: 1 }).onResponse(
      context as unknown as MiddlewareContext,
      respond({ status: "blocked" }, schema)
    );

    expect(directive).toMatchObject({ action: "RETRY" });
    const message = (directive as { message: string }).message;
    expect(message).toContain("status: ");
    expect(message).toContain('"passed"');
    expect(message).toContain('(got "blocked")');
  });
});

describe("lenient enums with Zod's catch()", () => {
  it("replaces an unknown value and still tells the model the allowed values", () => {
    const schema = z.object({ status: z.enum(["passed", "failed", "unknown"]).catch("unknown") });
    const response = respond({ status: "blocked" }, Schema.fromZod("verdict", schema));

    expect(response.data).toEqual({ status: "unknown" });
    expect(JSON.stringify(toJsonSchema(schema))).toContain('"enum":["passed","failed","unknown"]');
  });

  it("drops an unknown value from an optional field", () => {
    const schema = z.object({
      name: z.string(),
      priority: z.enum(["low", "high"]).optional().catch(undefined)
    });

    expect(respond({ name: "a", priority: "urgent" }, Schema.fromZod("s", schema)).data).toEqual({
      name: "a"
    });
  });

  it("drops unknown items from a list", () => {
    const action = z.enum(["click", "fill"]);
    const schema = z.object({
      actions: z
        .array(action.or(z.unknown()))
        .transform((items) => items.filter((item) => action.safeParse(item).success))
    });

    expect(
      respond({ actions: ["click", "hover", "fill"] }, Schema.fromZod("s", schema)).data
    ).toEqual({ actions: ["click", "fill"] });
  });
});
