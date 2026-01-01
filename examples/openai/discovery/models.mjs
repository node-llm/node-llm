import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "openai" });

  // 1. List Available Models
  console.log("--- Listing Models ---");
  const models = await LLM.listModels();
  console.log(`Found ${models.length} models. Top 5:`);
  console.table(models.slice(0, 5).map(m => ({ ID: m.id, Context: m.context_window })));

  // 2. Inspect Specific Model Capabilities
  console.log("\n--- Checking 'gpt-4o' ---");
  const model = LLM.models.find("gpt-4o");

  if (model) {
    console.log(`Context Window: ${model.context_window}`);
    console.log(`Input Modalities: ${model.modalities.input.join(", ")}`);
    console.log(`Capabilities: ${model.capabilities.join(", ")}`);
  }
}

main().catch(console.error);
