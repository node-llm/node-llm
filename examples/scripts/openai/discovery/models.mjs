import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });
  // 1. List Available Models
  console.log("--- Listing Models ---");
  const models = await llm.listModels();
  console.log(`Found ${models.length} models. Top 5:`);
  console.table(models.slice(0, 5).map((m) => ({ ID: m.id, Context: m.context_window })));

  // 2. Inspect Specific Model Capabilities
  console.log("\n--- Checking 'gpt-4o' ---");
  const model = NodeLLM.models.find("gpt-4o");

  if (model) {
    console.log(`Context Window: ${model.context_window}`);
    console.log(`Input Modalities: ${model.modalities.input.join(", ")}`);
    console.log(`Capabilities: ${model.capabilities.join(", ")}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
