import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure((config) => {
    config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  });
  
  LLM.configure({ provider: "deepseek" });
  
  console.log("Attempting multimodal vision request with DeepSeek...");
  try {
    const chat = LLM.chat("deepseek-chat");
    // Providing an image URL to a text-only model should raise an error
    await chat.ask("Describe this image", { images: ["https://example.com/image.jpg"] });
  } catch (error) {
    console.log("✅ Correctly caught unsupported operation error:");
    console.error(error.message);
  }
}

main().catch(console.error);
