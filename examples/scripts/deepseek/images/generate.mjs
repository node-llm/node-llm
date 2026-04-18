import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "deepseek",
    deepseekApiKey: process.env.DEEPSEEK_API_KEY
  });
  console.log("Attempting to generate image with DeepSeek...");
  try {
    // This should fail as image generation is not supported
    await llm.paint({ prompt: "A futuristic city" });
  } catch (error) {
    console.log("✅ Correctly caught unsupported operation error:");
    console.error(error.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
