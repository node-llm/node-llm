import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";
import fs from "fs/promises";

async function main() {
  NodeLLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "gemini" });

  try {
    console.log("🎨 Generatig with Imagen...");
    const image = await NodeLLM.paint("a futuristic space station", {
      model: "imagen-3.0-generate-001",
    });
    
    console.log(`✅ Image generated! MIME: ${image.mimeType}`);

    const filename = "space_station.png";
    console.log(`💾 Saving to ${filename}...`);
    await image.save(filename);

    const buffer = await image.toBuffer();
    console.log(`📊 Buffer size: ${buffer.length} bytes`);

    await fs.unlink(filename);
    console.log("🧹 Cleanup done.");

  } catch (error) {
    console.error("❌ Example failed:", error.message);
  }
}

main().catch(console.error);
