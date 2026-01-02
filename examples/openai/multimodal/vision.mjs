import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure((config) => {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  });
  
  LLM.configure({ provider: "openai" });

  const imageUrl = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";

  console.log("Analyzing image from URL...");
  const response = await LLM.chat("gpt-4o").ask("What is in this image?", {
    files: [imageUrl]
  });

  console.log("\nAssistant:", response.content);
}

main().catch(console.error);
