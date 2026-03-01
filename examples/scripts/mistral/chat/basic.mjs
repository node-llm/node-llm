import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("mistral");

  const chat = llm.chat("mistral-large-latest");
  console.log(`Using model: ${chat.modelId}`);

  console.log("--- Standard Request ---");
  const response = await chat
    .system("You are a helpful assistant.")
    .ask("What makes Mistral AI unique among LLM providers?");

  console.log(response.content);
  console.log("\n---");
  console.log("Model:", response.model);
  console.log("Input tokens:", response.tokenUsage?.input);
  console.log("Output tokens:", response.tokenUsage?.output);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
