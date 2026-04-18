import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY
  });
  // 1. List Available Models
  console.log("--- Listing Models ---");
  const models = await llm.listModels();
  console.table(
    models
      .map((m) => ({
        ID: m.id,
        Name: m.name,
        Context: m.context_window,
        Methods: m.metadata?.supportedGenerationMethods?.join(", ")
      }))
      .slice(0, 5)
  );

  // 2. Inspect Specific Model
  console.log("\n--- Checking 'gemini-2.0-flash' ---");
  const model = llm.models.find("gemini-2.0-flash");

  if (model) {
    console.log(`Context Window: ${model.context_window}`);
    console.log(`Input: ${model.modalities.input.join(", ")}`);
    console.log(`Capabilities: ${model.capabilities.join(", ")}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
