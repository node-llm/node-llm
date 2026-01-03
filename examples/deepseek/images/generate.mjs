import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  });
  
  NodeLLM.configure({ provider: "deepseek" });
  
  console.log("Attempting to generate image with DeepSeek...");
  try {
    // This should fail as image generation is not supported
    await NodeLLM.paint({ prompt: "A futuristic city" });
  } catch (error) {
    console.log("✅ Correctly caught unsupported operation error:");
    console.error(error.message);
  }
}

main().catch(console.error);
