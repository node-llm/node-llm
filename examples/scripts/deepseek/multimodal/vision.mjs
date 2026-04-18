import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "deepseek",
    deepseekApiKey: process.env.DEEPSEEK_API_KEY
  });
  console.log("Attempting multimodal vision request with DeepSeek...");
  try {
    const chat = llm.chat("deepseek-chat");
    // Providing an image URL to a text-only model should raise an error
    await chat.ask("Describe this image", { images: ["https://example.com/image.jpg"] });
  } catch (error) {
    console.log("✅ Correctly caught unsupported operation error:");
    console.error(error.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
