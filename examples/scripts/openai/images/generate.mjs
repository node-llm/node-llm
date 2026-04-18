import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";
import fs from "fs/promises";

async function main() {
  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });
  console.log("🎨 Generating image...");
  try {
    const image = await llm.paint("a cute robot holding a sign that says NODE-NodeLLM", {
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

main().catch(e => { console.error(e); process.exit(1); });
