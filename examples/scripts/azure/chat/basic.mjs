import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

// AZURE_API_KEY and AZURE_API_BASE name the resource; AZURE_MODEL is the deployment's name.
const deployment = process.env.AZURE_MODEL || "gpt-4o";

async function main() {
  const llm = NodeLLM.withProvider("azure");

  const chat = llm.chat(deployment);
  console.log(`Using deployment: ${chat.modelId}`);

  const response = await chat
    .system("You are a helpful assistant.")
    .ask("In two sentences, what is Azure AI Foundry?");

  console.log(response.content);
  console.log("\n---");
  console.log("Input tokens:", response.usage.input_tokens);
  console.log("Output tokens:", response.usage.output_tokens);
  console.log("Cost:", response.usage.cost ?? "unknown (deployment not in the registry)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
