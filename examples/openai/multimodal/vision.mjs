import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "openai" });

  const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gnome-face-smile.svg/1200px-Gnome-face-smile.svg.png";

  console.log("Analyzing image from URL...");
  const response = await LLM.chat("gpt-4o").ask("What is in this image?", {
    files: [imageUrl]
  });

  console.log("\nAssistant:", response.content);
}

main().catch(console.error);
