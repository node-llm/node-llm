import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("azure");

  // The models the resource's region offers, which can be deployed; not the deployments.
  console.log("--- Models this resource can deploy ---");
  const models = await llm.listModels();
  console.log(`Found ${models.length} models:\n`);
  models.slice(0, 20).forEach((model) => console.log(`- ${model.id}`));

  console.log("\n--- From the registry ---");
  const llama = NodeLLM.models.find("llama-3.3-70b-instruct", "azure");
  if (llama) {
    console.log(`Model: ${llama.id}`);
    console.log(`Context window: ${llama.context_window}`);
    console.log(`Capabilities: ${llama.capabilities.join(", ")}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
