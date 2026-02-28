import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  // Using NodeLLM directly - requires XAI_API_KEY
  const llm = NodeLLM.withProvider("xai");
  const chat = llm.chat("grok-3");

  // Example 1: Basic streaming
  console.log("=== Example 1: Basic Streaming ===");
  for await (const chunk of chat.stream("Count from 1 to 5 slowly.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\n");

  // Example 2: Streaming with error handling
  console.log("=== Example 2: Streaming with Error Handling ===");
  try {
    for await (const chunk of chat.stream("Explain quantum computing.")) {
      process.stdout.write(chunk.content || "");
    }
    console.log("\n");
  } catch (error) {
    console.error("Streaming error:", error.message);
  }

  // Example 3: Multiple concurrent streams (advanced)
  console.log("=== Example 3: Sequential Streams ===");
  const questions = ["What is AI?", "What is ML?", "What is DL?"];

  for (const question of questions) {
    console.log(`\nQ: ${question}`);
    console.log("A: ");
    for await (const chunk of chat.stream(question)) {
      process.stdout.write(chunk.content || "");
    }
    console.log();
  }

  console.log("\n=== All streaming examples completed ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
