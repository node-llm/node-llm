import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

/**
 * Bedrock Extra Fields Example
 * 
 * Demonstrates how to use the 'additionalModelRequestFields' escape hatch 
 * to pass provider-specific parameters that are not part of the standard Converse API.
 * 
 * This is useful for:
 * 1. Using model-specific parameters (like top_k for Nova/Llama).
 * 2. Using experimental or newly released features before they are officially mapped.
 */
async function main() {
  const llm = createLLM({
    provider: "bedrock",
    region: process.env.AWS_REGION || "us-east-1",
  });

  // Example: Using top_k which is supported by Llama and Nova models on Bedrock
  // but is not part of the base Bedrock Converse API inferenceConfig.
  const modelId = "amazon.nova-lite-v1:0";

  console.log(`--- Requesting with Provider-Specific Fields (${modelId}) ---\n`);

  try {
    const chat = llm.chat(modelId)
      .withParams({
        additionalModelRequestFields: {
          // You can pass any JSON structure supported by the underlying model
          inferenceConfig: {
            topK: 20
          },
          // Some models support specific flags (e.g. for performance or beta features)
          // "some_experimental_flag": true
        }
      });

    const response = await chat.ask("Tell me a brief fact about quantum computing.");

    console.log("Response Content:");
    console.log(response.content);
    
    console.log("\nUsage:", response.usage);
    console.log("\nNote: 'topK' was passed via the additionalModelRequestFields escape hatch.");

  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
