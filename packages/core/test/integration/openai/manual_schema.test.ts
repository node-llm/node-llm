import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../src/index.js";
import { setupVCR } from "../../helpers/vcr.js";
import "dotenv/config";

describe("OpenAI Manual Schema (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support structured output with manual JSON schema", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    NodeLLM.configure({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
    });
    const chat = NodeLLM.chat("gpt-4o-mini");

    // The user's exact manual schema example
    const person_schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        hobbies: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['name', 'age', 'hobbies'],
      additionalProperties: false
    };

    // We pass the schema name via the second argument if we want to name it (Schema.fromJson), 
    // or withSchema can handle raw objects if logic implies a default name.
    // My implementation of withSchema uses Schema.fromJson("output", ...) for raw objects.
    
    const response = await chat
      .withSchema(person_schema)
      .ask("Generate a person who likes Ruby");

    // Check automatic parsing
    const content = response.parsed;
    
    expect(content).toBeDefined();
    expect(content.name).toBeDefined();
    expect(typeof content.age).toBe("number");
    expect(Array.isArray(content.hobbies)).toBe(true);
    expect(content.hobbies.some((h: string) => h.toLowerCase().includes("ruby"))).toBe(true);
  });
});
