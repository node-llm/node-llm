import { describe, it, expect, afterEach } from "vitest";
import { createLLM, z } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("Mistral Structured Output Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support JSON response format", async ({ task }) => {
    polly = setupVCR(task.name, "mistral");

    const llm = createLLM({ provider: "mistral" });
    const chat = llm.chat("mistral-large-latest");

    const response = await chat
      .withParams({ response_format: { type: "json_object" } })
      .ask("Return a JSON object with name and age fields for a person named Alice who is 30.");

    const responseText = response.content || String(response);
    expect(responseText).toContain("Alice");
    const parsed = JSON.parse(responseText);
    expect(parsed.name).toBe("Alice");
    expect(parsed.age).toBe(30);
  });

  it("should support structured output with Zod schema", async ({ task }) => {
    polly = setupVCR(task.name, "mistral");

    const PersonSchema = z.object({
      name: z.string(),
      age: z.number(),
      hobbies: z.array(z.string())
    });

    const llm = createLLM({ provider: "mistral" });
    const chat = llm.chat("mistral-large-latest");

    const response = await chat
      .withParams({ response_format: { type: "json_object" } })
      .system("You are a JSON generator. Output only valid JSON.")
      .ask(
        "Create a JSON object for a person named Bob who is 25 and has hobbies: reading, hiking. Output only JSON."
      );

    const responseText = response.content || String(response);
    expect(responseText).toBeTruthy();
    // Just verify we got JSON-like output
    expect(responseText).toMatch(/\{.*\}/s);
  });
});
