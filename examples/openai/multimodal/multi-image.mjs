import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "openai" });

  const chat = LLM.chat("gpt-4o");

  const img1 = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gnome-face-smile.svg/1200px-Gnome-face-smile.svg.png";
  const img2 = "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png";

  console.log("Analyzing two images at once...");
  
  const response = await chat.ask("Compare these two images. What is different?", {
    images: [img1, img2]
  });

  console.log("\nAssistant:", response.content);
}

main().catch(console.error);
