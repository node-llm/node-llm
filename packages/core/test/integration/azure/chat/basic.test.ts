import { describe, it, expect, afterEach } from "vitest";
import { setupVCR } from "../../../helpers/vcr.js";
import { azure, DEPLOYMENT } from "../helpers.js";
import "dotenv/config";

describe("Azure Chat Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should chat through a deployment's address, priced as its model", async ({ task }) => {
    polly = setupVCR(task.name, "azure");

    const response = await azure("deployment")
      .chat(DEPLOYMENT)
      .ask("What is 2 + 2? Answer with just the number.");

    expect(String(response)).toContain("4");
    expect(response.total_tokens).toBeGreaterThan(0);
    expect(response.usage.cost).toBeGreaterThan(0);
  });

  it("should chat through the resource's v1 address", async ({ task }) => {
    polly = setupVCR(task.name, "azure");

    const response = await azure("v1")
      .chat(DEPLOYMENT)
      .ask("What is the capital of France? Answer with one word.");

    expect(String(response)).toMatch(/paris/i);
  });

  it("should chat through the resource's model inference endpoint", async ({ task }) => {
    polly = setupVCR(task.name, "azure");

    const response = await azure("resource")
      .chat(DEPLOYMENT)
      .ask("What is the capital of Japan? Answer with one word.");

    expect(String(response)).toMatch(/tokyo/i);
  });

  it("should support streaming", async ({ task }) => {
    polly = setupVCR(task.name, "azure");

    let fullText = "";
    for await (const chunk of azure().chat(DEPLOYMENT).stream("Count from 1 to 3, digits only.")) {
      fullText += chunk.content;
    }

    expect(fullText).toMatch(/1[\s\S]*2[\s\S]*3/);
  });

  it("should support system messages", async ({ task }) => {
    polly = setupVCR(task.name, "azure");

    const response = await azure()
      .chat(DEPLOYMENT)
      .system("You are a pirate. Always say 'Arr' in your answer.")
      .ask("Greet me in one short sentence.");

    expect(String(response)).toMatch(/arr/i);
  });
});
