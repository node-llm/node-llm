import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("mistral");

  // --- List Available Models ---
  console.log("--- Available Mistral Models ---");
  const models = await llm.listModels();

  console.log(`Found ${models.length} models:\n`);
  models.forEach((model) => {
    console.log(`- ${model.id}`);
    if (model.description) {
      console.log(`  ${model.description}`);
    }
  });

  // --- Find Specific Model from Registry ---
  console.log("\n--- Find Model from Registry ---");
  const model = NodeLLM.models.find("mistral-large-latest");
  if (model) {
    console.log(`Model: ${model.id}`);
    console.log(`Provider: ${model.provider}`);
    console.log(`Context window: ${model.contextWindow}`);
    console.log(`Supports vision: ${model.capabilities?.vision ?? false}`);
    console.log(`Supports tools: ${model.capabilities?.tools ?? false}`);
  }

  // --- List All Mistral Models in Registry ---
  console.log("\n--- All Mistral Models in Registry ---");
  const mistralModels = NodeLLM.models.all().filter((m) => m.provider === "mistral");
  mistralModels.forEach((m) => {
    console.log(`- ${m.id} (context: ${m.contextWindow})`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
