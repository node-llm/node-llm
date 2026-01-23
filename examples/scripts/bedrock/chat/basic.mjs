import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  // Using NodeLLM with Bedrock - requires AWS_BEARER_TOKEN_BEDROCK and AWS_REGION
  // Make sure these are set in your .env file

  const llm = NodeLLM.withProvider("bedrock");
  const chat = llm.chat("anthropic.claude-3-5-haiku-20241022-v1:0");
  console.log(`Using model: ${chat.modelId}`);

  // 1. Standard Request
  console.log("--- Standard Request ---");
  const response = await chat.ask("What are the main benefits of using AWS Bedrock?");
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
