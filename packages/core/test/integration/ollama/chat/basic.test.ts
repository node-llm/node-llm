import { describe, it, expect, afterEach } from "vitest";
import { createLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";

describe("Ollama Integration (VCR)", { timeout: 60000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) await polly.stop();
  });

  it("should chat with local model", async ({ task }) => {
    polly = setupVCR(task.name, "ollama");

    const llm = createLLM({
      provider: "ollama",
      // Explicitly set mostly for documentation, defaults to localhost
      ollamaApiBase: "http://localhost:11434/v1"
    });

    const chat = llm.chat("llama3");

    const response = await chat.ask("Hello");
    expect(response.content).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);
  });

  it("should list local models", async ({ task }) => {
    polly = setupVCR(task.name, "ollama");

    const llm = createLLM({ provider: "ollama" });
    const models = await llm.listModels();

    expect(models).toBeInstanceOf(Array);
    if (models.length > 0) {
      expect(models[0].provider).toBe("ollama");
    }
  });
});
