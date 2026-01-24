import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({ provider: "bedrock" });

  console.log("=== Max Tokens Example ===\n");

  // Example 1: Short response
  console.log("--- Example 1: Limited tokens (50) ---");
  const chat1 = llm.chat("amazon.nova-lite-v1:0");
  const response1 = await chat1.ask("Explain quantum computing", { max_tokens: 50 });
  console.log(response1.content);
  console.log(`Output tokens used: ${response1.usage?.output_tokens}`);
  console.log("\n");

  // Example 2: Medium response
  console.log("--- Example 2: Medium tokens (200) ---");
  const chat2 = llm.chat("amazon.nova-lite-v1:0");
  const response2 = await chat2.ask("Explain quantum computing", { max_tokens: 200 });
  console.log(response2.content);
  console.log(`Output tokens used: ${response2.usage?.output_tokens}`);
  console.log("\n");

  // Example 3: Longer response
  console.log("--- Example 3: More tokens (500) ---");
  const chat3 = llm.chat("amazon.nova-lite-v1:0");
  const response3 = await chat3.ask("Explain quantum computing in detail", { max_tokens: 500 });
  console.log(response3.content);
  console.log(`Output tokens used: ${response3.usage?.output_tokens}`);
  console.log("\n");

  console.log("=== Max tokens examples completed ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
