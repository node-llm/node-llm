import "dotenv/config";
import { LLM } from "../../packages/core/dist/index.js";

LLM.configure({ 
  provider: "openai"
});

async function main() {
  console.log("🎨 Painting: a futuristic city in cyberpunk style...");
  
  try {
    const image = await LLM.paint("a futuristic city in cyberpunk style", {
      model: "dall-e-3",
      size: "1024x1024"
    });
    
    console.log("✅ Concept Art Generated!");
    console.log("URL:", image.url); // Use .url for explicit clean print
    console.log("Revised Prompt:", image.revisedPrompt);
  } catch (e) {
    console.error("Paint failed:", e.message);
  }
}

main();
