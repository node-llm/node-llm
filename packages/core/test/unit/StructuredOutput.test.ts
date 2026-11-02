import { describe, it, expect } from "vitest";
import { ChatResponseString } from "../../src/chat/ChatResponse.js";
import { Schema } from "../../src/schema/Schema.js";
import { z } from "zod/v3";

describe("Structured Output Reliability", () => {
  const personSchema = z.object({
    name: z.string(),
    age: z.number()
  });
  const schema = Schema.fromZod("person", personSchema);

  const usage = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

  it("handles perfectly formatted JSON", () => {
    const raw = '{"name": "Alice", "age": 30}';
    const response = new ChatResponseString(
      raw,
      usage,
      "test",
      "test",
      undefined,
      undefined,
      undefined,
      "stop",
      schema
    );

    expect(response.isValid).toBe(true);
    expect(response.data).toEqual({ name: "Alice", age: 30 });
  });

  it("handles JSON wrapped in markdown (Claude/Anthropic style)", () => {
    const raw = 'Sure! Here is the data:\n\n```json\n{"name": "Alice", "age": 30}\n```';
    const response = new ChatResponseString(
      raw,
      usage,
      "test",
      "test",
      undefined,
      undefined,
      undefined,
      "stop",
      schema
    );

    expect(response.isValid).toBe(true);
    expect(response.data).toEqual({ name: "Alice", age: 30 });
  });

  it("handles bare JSON inside conversational text (Gemini style fallback)", () => {
    const raw = 'Generated user: {"name": "Alice", "age": 30}. Hope this helps!';
    const response = new ChatResponseString(
      raw,
      usage,
      "test",
      "test",
      undefined,
      undefined,
      undefined,
      "stop",
      schema
    );

    expect(response.isValid).toBe(true);
    expect(response.data).toEqual({ name: "Alice", age: 30 });
  });

  it("throws validation error when fields are missing", () => {
    const raw = '{"name": "Alice"}'; // Missing age
    const response = new ChatResponseString(
      raw,
      usage,
      "test",
      "test",
      undefined,
      undefined,
      undefined,
      "stop",
      schema
    );

    expect(response.isValid).toBe(false);
    expect(() => response.data).toThrow();
    expect(response.safeData).toBeNull();
  });

  it("provides specific validation errors", () => {
    const raw = '{"name": "Alice", "age": "thirty"}'; // Wrong type
    const response = new ChatResponseString(
      raw,
      usage,
      "test",
      "test",
      undefined,
      undefined,
      undefined,
      "stop",
      schema
    );

    expect(response.validationError).toBeDefined();
    expect(response.validationError?.message).toContain("Expected number, received string");
  });
});
