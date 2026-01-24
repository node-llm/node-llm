import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

/**
 * Bedrock Vision Example
 * 
 * Demonstrates multimodal capabilities using Amazon Nova Lite.
 * Nova Lite supports image analysis via the Bedrock Converse API.
 */
async function main() {
  const llm = createLLM({
    provider: "bedrock",
    region: process.env.AWS_REGION || "us-east-1",
  });

  const modelId = "amazon.nova-lite-v1:0";
  const imageUrl = "https://raw.githubusercontent.com/node-llm/node-llm/main/docs/assets/logo.png";

  console.log(`--- Analyzing image with ${modelId} ---`);
  
  try {
    const response = await llm.chat(modelId)
      .ask("What is in this image? Describe the logo and any text you see.", {
        images: [imageUrl]
      });

    console.log("\nAssistant:", response.content);
    console.log("\nUsage:", response.usage);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
