import "dotenv/config";
import { LLM } from "./packages/core/dist/index.js";

LLM.configure({ 
  provider: "openai",
});

async function main() {
  console.log("🎨 Generating image...");
  try {
    const image = await LLM.paint("a sunset over mountains in watercolor style", {
      model: "dall-e-3",
      size: "1024x1024",
    });
    console.log("✅ Image generated!");
    console.log("URL:", image.url);
    if (image.revised_prompt) {
      console.log("Revised Prompt:", image.revised_prompt);
    }
  } catch (error) {
    console.error("❌ Failed to generate image:", error.message);
  }
}

main();
