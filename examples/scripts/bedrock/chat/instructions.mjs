import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({ provider: "bedrock" });

  console.log("=== System Instructions Example ===\n");

  // Example 1: Simple system prompt
  console.log("--- Example 1: Simple System Prompt ---");
  const chat1 = llm
    .chat("amazon.nova-lite-v1:0")
    .withSystemPrompt("You are a helpful pirate assistant. Always respond in pirate speak.");

  const response1 = await chat1.ask("What's the weather like today?");
  console.log(response1.content);
  console.log("\n");

  // Example 2: Technical assistant
  console.log("--- Example 2: Technical Assistant ---");
  const chat2 = llm
    .chat("amazon.nova-lite-v1:0")
    .withSystemPrompt(
      "You are a senior software engineer specializing in Node.js and TypeScript. " +
        "Provide concise, technically accurate answers with code examples when relevant."
    );

  const response2 = await chat2.ask("How do I handle errors in async/await?");
  console.log(response2.content);
  console.log("\n");

  // Example 3: Constrained output
  console.log("--- Example 3: Constrained Output ---");
  const chat3 = llm
    .chat("amazon.nova-lite-v1:0")
    .withSystemPrompt(
      "You are a JSON generator. Always respond with valid JSON only. " +
        "Do not include any explanatory text outside the JSON."
    );

  const response3 = await chat3.ask("Generate a user profile for a developer named Alice");
  console.log(response3.content);
  console.log("\n");

  console.log("=== All instruction examples completed ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
