import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  buildMessageRequest,
  structuredOutputSchema
} from "../../../../src/providers/anthropic/Utils.js";
import { Capabilities } from "../../../../src/providers/anthropic/Capabilities.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";
import { toJsonSchema } from "../../../../src/schema/to-json-schema.js";

const verdict = z.object({
  status: z.enum(["passed", "failed"]),
  reason: z.string().min(1).max(500),
  steps: z.array(z.object({ action: z.string(), count: z.number().int().min(0) })).max(20)
});

const request = (model: string, schema = toJsonSchema(verdict)): ChatRequest => ({
  model,
  messages: [
    { role: "system", content: "You review tests." },
    { role: "user", content: "Did it pass?" }
  ],
  response_format: { type: "json_schema", json_schema: { name: "verdict", schema } }
});

describe("Anthropic structured outputs", () => {
  it("holds a model that supports it to the schema with output_config.format", () => {
    const body = buildMessageRequest(request("claude-sonnet-5-5"), false);

    expect(body.system).toBe("You review tests.");
    expect(body.output_config).toEqual({
      format: { type: "json_schema", schema: expect.objectContaining({ type: "object" }) }
    });
    const schema = JSON.stringify(body.output_config!.format);
    expect(schema).toContain('"enum":["passed","failed"]');
    expect(schema).not.toMatch(/minLength|maxLength|minimum|maxItems/);
  });

  it("keeps effort alongside the format", () => {
    const body = buildMessageRequest(
      { ...request("claude-opus-5-5"), thinking: { effort: "low" } } as ChatRequest,
      false
    );

    expect(body.output_config).toMatchObject({ effort: "low", format: { type: "json_schema" } });
  });

  it("asks an older model for the schema in the prompt, as before", () => {
    const body = buildMessageRequest(request("claude-3-5-sonnet-20241022"), false);

    expect(body.output_config?.format).toBeUndefined();
    expect(body.system).toContain("CRITICAL: Respond ONLY with a valid JSON object");
  });

  it("asks in the prompt for a schema structured outputs can't take", () => {
    const record = toJsonSchema(z.object({ scores: z.record(z.string(), z.number()) }));
    const body = buildMessageRequest(request("claude-sonnet-5-5", record), false);

    expect(body.output_config?.format).toBeUndefined();
    expect(body.system).toContain("CRITICAL");
  });

  it("knows which models take a schema", () => {
    for (const model of [
      "claude-fable-5-2",
      "claude-mythos-5-1",
      "claude-opus-5-5",
      "claude-opus-5",
      "claude-opus-4-8",
      "claude-opus-4-5-20251101",
      "claude-opus-4-1",
      "claude-sonnet-5-5",
      "claude-sonnet-5",
      "claude-haiku-5-5",
      "claude-haiku-4-5",
      "us.anthropic.claude-sonnet-5-5"
    ])
      expect(Capabilities.supportsStructuredOutputs(model), model).toBe(true);
    for (const model of [
      "claude-3-5-sonnet-20241022",
      "claude-sonnet-4-5",
      "claude-opus-4-6",
      "claude-opus-4",
      "claude-haiku-3-5"
    ])
      expect(Capabilities.supportsStructuredOutputs(model), model).toBe(false);
  });
});

describe("structuredOutputSchema", () => {
  it("leaves out constraints and closes every object", () => {
    expect(
      structuredOutputSchema({
        type: "object",
        properties: {
          minimum: { type: "number", minimum: 1 },
          tags: { type: "array", items: { type: "object", properties: {} }, minItems: 1 }
        },
        required: ["minimum"]
      })
    ).toEqual({
      type: "object",
      properties: {
        minimum: { type: "number" },
        tags: {
          type: "array",
          items: { type: "object", properties: {}, additionalProperties: false }
        }
      },
      required: ["minimum"],
      additionalProperties: false
    });
  });

  it("can't take a schema that refers to itself", () => {
    expect(
      structuredOutputSchema({
        type: "object",
        properties: { children: { type: "array", items: { $ref: "#" } } }
      })
    ).toBeUndefined();
  });
});
