
import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";


describe("Ollama Integration (VCR)", { timeout: 60000 }, () => {
  let polly: any;

  afterEach(async () => {
    if (polly) await polly.stop();
  });

  it("should chat with local model", async ({ task }) => {
    polly = setupVCR(task.name, "ollama");
    
    NodeLLM.configure({ 
        provider: "ollama",
        // Explicitly set mostly for documentation, defaults to localhost
        ollamaApiBase: "http://localhost:11434/v1" 
    });

    const chat = NodeLLM.chat("llama3");
    
    const response = await chat.ask("Hello");
    expect(response.content).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);
  });

  it("should list local models", async ({ task }) => {
      polly = setupVCR(task.name, "ollama");
      
      NodeLLM.configure({ provider: "ollama" });
      const models = await NodeLLM.listModels();
      
      expect(models).toBeInstanceOf(Array);
      if (models.length > 0) {
          expect(models[0].provider).toBe("ollama");
      }
  });
});
