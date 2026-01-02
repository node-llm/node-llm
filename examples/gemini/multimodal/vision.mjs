import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  LLM.configure({ provider: "gemini" });

  const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gnome-face-smile.svg/1200px-Gnome-face-smile.svg.png";

  console.log("Gemini analyzing image...");
  const response = await LLM.chat("gemini-2.0-flash").ask("Describe this image.", {
    files: [imageUrl]
  });

  console.log("\nGemini:", response.content);
}

main().catch(console.error);
