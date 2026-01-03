import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "gemini" });

  // 1. List Available Models
  console.log("--- Listing Models ---");
  const models = await NodeLLM.listModels();
  console.table(models.map(m => ({
    ID: m.id,
    Name: m.name,
    Context: m.context_window,
    Methods: m.metadata?.supportedGenerationMethods?.join(", ")
  })).slice(0, 5));

  // 2. Inspect Specific Model
  console.log("\n--- Checking 'gemini-2.0-flash' ---");
  const model = NodeLLM.models.find("gemini-2.0-flash");

  if (model) {
    console.log(`Context Window: ${model.context_window}`);
    console.log(`Input: ${model.modalities.input.join(", ")}`);
    console.log(`Capabilities: ${model.capabilities.join(", ")}`);
  }
}

main().catch(console.error);
