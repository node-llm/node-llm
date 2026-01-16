import { describe, it, expect, afterEach } from "vitest";
import { createLLM, z } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

describe("DeepSeek Chat Structured Output Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should support structured output with Zod", async ({ task }) => {
    polly = setupVCR(task.name, "deepseek");
    const llm = createLLM({
      deepseekApiKey: process.env.DEEPSEEK_API_KEY,
      provider: "deepseek"
    });
    const chat = llm.chat("deepseek-chat");

    const recipeSchema = z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      prep_time: z.number()
    });

    const response = await chat.withSchema(recipeSchema).ask("Give me a recipe for toast.");

    const parsed = response.parsed as z.infer<typeof recipeSchema>;
    expect(parsed).toBeDefined();
    expect(parsed.name).toBeDefined();
    expect(Array.isArray(parsed.ingredients)).toBe(true);
    expect(typeof parsed.prep_time).toBe("number");
  });
});
