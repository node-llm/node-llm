import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "openai" });

  const imageUrl = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";

  console.log("Analyzing image from URL...");
  const response = await NodeLLM.chat("gpt-4o").ask("What is in this image?", {
    files: [imageUrl]
  });

  console.log("\nAssistant:", response.content);
}

main().catch(console.error);
