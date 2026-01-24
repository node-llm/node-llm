import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({ provider: "bedrock" });
  const chat = llm.chat("amazon.nova-lite-v1:0");

  console.log("=== Token Usage Example ===\n");

  // Simple request
  const response = await chat.ask("What is the capital of France?");

  console.log("Response:", response.content);
  console.log("\n--- Usage Statistics ---");
  console.log(`Input tokens: ${response.usage?.input_tokens}`);
  console.log(`Output tokens: ${response.usage?.output_tokens}`);
  console.log(`Total tokens: ${response.usage?.total_tokens}`);

  // Calculate approximate cost (Nova Lite pricing: $0.06/$0.24 per 1M)
  const inputCost = (response.usage?.input_tokens || 0) * (0.06 / 1_000_000);
  const outputCost = (response.usage?.output_tokens || 0) * (0.24 / 1_000_000);
  console.log(`\n--- Approximate Cost (Nova Lite) ---`);
  console.log(`Input cost: $${inputCost.toFixed(6)}`);
  console.log(`Output cost: $${outputCost.toFixed(6)}`);
  console.log(`Total cost: $${(inputCost + outputCost).toFixed(6)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
