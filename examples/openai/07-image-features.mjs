import "dotenv/config";
import { LLM } from "../../packages/core/dist/index.js";
import fs from "fs/promises";

LLM.configure({ 
  provider: "openai",
});

async function main() {
  console.log("🎨 Generating image...");
  try {
    const image = await LLM.paint("a cute robot holding a sign that says NODE-LLM", {
      model: "dall-e-3",
      size: "1024x1024",
    });
    
    console.log("✅ Image generated!");
    console.log("URL:", image.url);
    console.log("Revised Prompt:", image.revisedPrompt);

    // Test saving to disk
    const filename = "robot.png";
    console.log(`💾 Saving image to ${filename}...`);
    await image.save(filename);
    console.log("✅ Saved!");

    // Test Buffer conversion
    const buffer = await image.toBuffer();
    console.log(`📊 Buffer size: ${buffer.length} bytes`);

    // Cleanup
    await fs.unlink(filename);
    console.log("🧹 Cleanup done.");

  } catch (error) {
    console.error("❌ Example failed:", error.message);
  }
}

main();
