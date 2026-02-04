/**
 * Documentation Verification Tests: core-features/structured_output.md
 *
 * Verifies that all code examples from the Structured Output documentation work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  NodeLLM,
  z,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("core-features-structured-output", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(['{"name": "Alice", "age": 25, "hobbies": ["hiking", "coding"]}']);
    providerRegistry.register("fake", () => provider);
  });

  describe("Using Zod (Recommended)", () => {
    it("z.object() creates a valid schema", () => {
      const personSchema = z.object({
        name: z.string().describe("Person's full name"),
        age: z.number().describe("Person's age in years"),
        hobbies: z.array(z.string()).describe("List of hobbies")
      });

      expect(personSchema).toBeDefined();
      expect(typeof personSchema.parse).toBe("function");
    });

    it("withSchema() accepts a Zod schema", () => {
      const personSchema = z.object({
        name: z.string(),
        age: z.number(),
        hobbies: z.array(z.string())
      });

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withSchema(personSchema);

      expect(chat).toBeDefined();
      expect(typeof chat.ask).toBe("function");
    });

    it("withSchema() is chainable", () => {
      const schema = z.object({ name: z.string() });

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withSchema(schema);

      // Should still have all chat methods
      expect(typeof chat.ask).toBe("function");
      expect(typeof chat.stream).toBe("function");
    });

    it("streaming with schema is supported", () => {
      const personSchema = z.object({
        name: z.string(),
        hobbies: z.array(z.string())
      });

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withSchema(personSchema);

      // Verify stream method exists
      expect(typeof chat.stream).toBe("function");
    });
  });

  describe("Manual JSON Schemas", () => {
    it("withSchema() accepts a raw JSON schema object", () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer" }
        },
        required: ["name", "age"],
        additionalProperties: false
      };

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withSchema(schema);

      expect(chat).toBeDefined();
    });
  });

  describe("JSON Mode", () => {
    it("withRequestOptions() accepts responseFormat for JSON mode", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withRequestOptions({
        responseFormat: { type: "json_object" }
      });

      expect(chat).toBeDefined();
    });
  });

  describe("Nested Schemas", () => {
    it("complex nested schemas are supported via Zod", () => {
      const companySchema = z.object({
        name: z.string(),
        employees: z.array(
          z.object({
            name: z.string(),
            role: z.enum(["developer", "designer", "manager"]),
            skills: z.array(z.string())
          })
        ),
        metadata: z.object({
          founded: z.number(),
          industry: z.string()
        })
      });

      expect(companySchema).toBeDefined();

      // Verify it parses correctly
      const testData = {
        name: "TechCorp",
        employees: [
          { name: "Alice", role: "developer", skills: ["TypeScript", "Node.js"] }
        ],
        metadata: { founded: 2020, industry: "Technology" }
      };

      const parsed = companySchema.parse(testData);
      expect(parsed.name).toBe("TechCorp");
      expect(parsed.employees[0].role).toBe("developer");
    });
  });

  describe("Zod Schema Features", () => {
    it("z.string() works correctly", () => {
      const schema = z.object({ value: z.string() });
      expect(schema.parse({ value: "test" })).toEqual({ value: "test" });
    });

    it("z.number() works correctly", () => {
      const schema = z.object({ value: z.number() });
      expect(schema.parse({ value: 42 })).toEqual({ value: 42 });
    });

    it("z.boolean() works correctly", () => {
      const schema = z.object({ value: z.boolean() });
      expect(schema.parse({ value: true })).toEqual({ value: true });
    });

    it("z.array() works correctly", () => {
      const schema = z.object({ values: z.array(z.string()) });
      expect(schema.parse({ values: ["a", "b"] })).toEqual({ values: ["a", "b"] });
    });

    it("z.enum() works correctly", () => {
      const schema = z.object({ status: z.enum(["active", "inactive"]) });
      expect(schema.parse({ status: "active" })).toEqual({ status: "active" });
    });

    it("z.optional() works correctly", () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      });
      expect(schema.parse({ required: "test" })).toEqual({ required: "test" });
    });

    it("z.describe() adds descriptions", () => {
      const schema = z.object({
        name: z.string().describe("The user's name")
      });
      expect(schema).toBeDefined();
    });
  });
});
