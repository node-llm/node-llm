import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "openai" });

  const chat = LLM.chat("gpt-4o");

  const img1 = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";
  const img2 = "https://www.w3.org/People/mimasa/test/imgformat/img/w3c_home.png";

  console.log("Analyzing two images at once...");
  
  const response = await chat.ask("Compare these two images. What is different?", {
    images: [img1, img2]
  });

  console.log("\nAssistant:", response.content);
}

main().catch(console.error);
