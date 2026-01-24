import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({ provider: "bedrock" });

  console.log("=== Chat Parameters Example ===\n");

  // Example 1: Temperature control
  console.log("--- Example 1: Low temperature (0.1) - More deterministic ---");
  const chat1 = llm.chat("amazon.nova-lite-v1:0");
  const response1 = await chat1.ask("Generate a random color name", { temperature: 0.1 });
  console.log(response1.content);
  console.log("\n");

  console.log("--- Example 2: High temperature (0.9) - More creative ---");
  const chat2 = llm.chat("amazon.nova-lite-v1:0");
  const response2 = await chat2.ask("Generate a random color name", { temperature: 0.9 });
  console.log(response2.content);
  console.log("\n");

  // Example 3: Combined parameters
  console.log("--- Example 3: Combined parameters ---");
  const chat3 = llm.chat("amazon.nova-lite-v1:0");
  const response3 = await chat3.ask("Write a haiku about programming", {
    temperature: 0.7,
    max_tokens: 100
  });
  console.log(response3.content);
  console.log("\n");

  console.log("=== Parameters examples completed ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
