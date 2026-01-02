import { describe, it, expect, afterEach } from "vitest";
import { LLM } from "../../../src/index.js";
import { setupVCR } from "../../helpers/vcr.js";
import { z } from "zod";
import "dotenv/config";

describe("OpenAI Structured Output (VCR)", { timeout: 30000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support structured output with Zod schema", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    LLM.configure({
      openaiApiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
    });
    const chat = LLM.chat("gpt-4o-mini");

    const schema = z.object({
      name: z.string(),
      age: z.number(),
      hobbies: z.array(z.string())
    });

    const response = await chat
      .withSchema(schema)
      .ask("Generate a person named Alice who is 30 and likes hiking.");

    // The raw content should be JSON
    expect(String(response)).toContain("{");
    
    // The parsed content should allow access to properties
    const person = response.parsed;
    expect(person.name).toBe("Alice");
    expect(person.age).toBe(30);
    expect(person.hobbies).toContain("hiking");
  });
});
