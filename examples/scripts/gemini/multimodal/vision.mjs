import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY
  });
  const imageUrl =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gnome-face-smile.svg/1200px-Gnome-face-smile.svg.png";

  console.log("Gemini analyzing image...");
  const response = await llm.chat("gemini-2.0-flash").ask("Describe this image.", {
    files: [imageUrl]
  });

  console.log("\nGemini:", response.content);
}

main().catch(e => { console.error(e); process.exit(1); });
