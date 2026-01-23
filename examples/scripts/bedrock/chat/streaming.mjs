import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({ provider: "bedrock" });
  const chat = llm.chat("anthropic.claude-3-5-haiku-20241022-v1:0");

  console.log("=== Streaming Example ===");
  console.log("Note: Bedrock streaming via Converse API is coming soon.");
  console.log("This example demonstrates the future streaming interface.\n");

  // For now, using non-streaming
  console.log("--- Non-streaming fallback ---");
  const response = await chat.ask("Tell me a short story about a robot learning to paint.");
  console.log(response.content);

  console.log("\n--- Token Usage ---");
  console.log(`Input tokens: ${response.usage?.input_tokens}`);
  console.log(`Output tokens: ${response.usage?.output_tokens}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
