import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";
import fs from "fs/promises";

async function main() {
  LLM.configure((config) => {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  });
  
  LLM.configure({ provider: "openai" });

  console.log("🎨 Generating image...");
  try {
    const image = await LLM.paint("a cute robot holding a sign that says NODE-LLM", {
      model: "dall-e-3",
      size: "1024x1024" // DALL-E 3 standard
    });
    
    console.log(`✅ Image generated! URL: ${image.url}`);

    // 1. Save to disk
    const filename = "robot.png";
    console.log(`💾 Saving image to ${filename}...`);
    await image.save(filename);

    // 2. Convert to Buffer (for further processing)
    const buffer = await image.toBuffer();
    console.log(`📊 Buffer size: ${buffer.length} bytes`);

    // Cleanup
    await fs.unlink(filename);
    console.log("🧹 Cleanup done.");

  } catch (error) {
    console.error("❌ Example failed:", error.message);
  }
}

main().catch(console.error);
