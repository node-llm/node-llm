import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });

  const chat = llm.chat("gpt-4o-mini");

  const originalCode = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}`;

  console.log("--- Original Code ---");
  console.log(originalCode);
  console.log("\n--- Requesting Refactor to `.reduce` with Predicted Outputs ---");

  // By passing the 'originalCode' into .withPrediction(), OpenAI can intelligently
  // skip recalculating/regenerating identical tokens and only stream the diff!
  const response = await chat
    .withPrediction(originalCode)
    .ask(
      "Refactor the following function to use standard Array.prototype.reduce logic instead of a for-loop.\n\n" +
        originalCode
    );

  console.log("\n--- Refactored Code ---");
  console.log(response.content);

  console.log("\n--- Latency Optimization ---");
  console.log("Input Tokens: ", response.usage?.input_tokens);
  console.log("Output Tokens:", response.usage?.output_tokens);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
