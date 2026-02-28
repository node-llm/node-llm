import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  // Using NodeLLM directly - requires XAI_API_KEY
  // NodeLLM uses environment variables by default
  // Make sure XAI_API_KEY is set in your .env file
  // You need to setup xai explicitly if not set in defaults
  const llm = NodeLLM.withProvider("xai");

  // No model specified - defaults to grok-2 for xAI provider
  const chat = llm.chat("grok-3");
  console.log(`Using provider: xAI`);
  console.log(`Using model: ${chat.modelId}`);

  // 1. Standard Request
  console.log("\n--- Standard Request ---");
  const response = await chat.ask("What is Node.js?");
  console.log(response.content);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
