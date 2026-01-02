
import { describe, it, expect } from "vitest";
import { LLM } from "../../../../src/index.js";

// Note: These tests require a local Ollama instance running with 'llama3' or similar pulled.
// They will fail if Ollama is unreachable, so we wrap in try/catch to avoid breaking global CI.

describe("Ollama Integration", () => {
  it("should chat with local model", async () => {
    LLM.configure({ provider: "ollama" });
    const chat = LLM.chat("llama3");
    
    try {
      const response = await chat.ask("Hello");
      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);
    } catch (e: any) {
      if (e.cause?.code === "ECONNREFUSED" || e.message.includes("404") || e.message.includes("not found")) {
          console.warn(`[SKIPPING] Ollama not available or model missing: ${e.message}`);
          return;
      }
      throw e;
    }
  });

  it("should list local models", async () => {
      LLM.configure({ provider: "ollama" });
      try {
          const models = await LLM.listModels();
          expect(models).toBeInstanceOf(Array);
          
          if (models.length > 0) {
              // Verify our update to Models.ts works (provider should be 'ollama')
              expect(models[0].provider).toBe("ollama");
          }
      } catch (e: any) {
         if (e.cause?.code === "ECONNREFUSED") {
             console.warn("[SKIPPING] Ollama not reachable.");
             return;
         }
         throw e;
      }
  });
});
