import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });
  const imageUrl =
    "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";

  console.log("Analyzing image from URL...");
  const response = await llm.chat("gpt-4o").ask("What is in this image?", {
    files: [imageUrl]
  });

  console.log("\nAssistant:", response.content);
}

main().catch(e => { console.error(e); process.exit(1); });
