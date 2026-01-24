import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  // Amazon Nova models - often included in trials/free tier
  const model = "amazon.nova-lite-v1:0"; 
  
  process.env.NODELLM_DEBUG = "true";
  
  const llm = createLLM({
    provider: "bedrock",
    bedrockRegion: process.env.AWS_REGION || "us-east-1"
  });

  console.log(`Using model: ${model}`);
  console.log("--- Standard Request ---");

  try {
    const response = await llm.chat(model).ask("Say 'Bedrock is online' if you can hear me.");

    console.log("Response:", response.content);
    console.log("\n--- Token Usage ---");
    console.log(`Input tokens: ${response.usage.input_tokens}`);
    console.log(`Output tokens: ${response.usage.output_tokens}`);
  } catch (error) {
    console.error("\nError:", error.message);
  }
}

main().catch(console.error);
