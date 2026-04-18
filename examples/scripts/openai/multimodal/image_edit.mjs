import { NodeLLM } from "../../../../packages/core/dist/index.js";
import "dotenv/config";
import fs from "fs";

async function main() {
  const llm = NodeLLM.withProvider("openai", {
    apiKey: process.env.OPENAI_API_KEY
  });

  const logoPath = "logo.png";

  if (!fs.existsSync(logoPath)) {
    console.log("🎨 No logo.png found. Generating a base image first...");
    try {
      const baseImage = await llm.paint("A simple square logo with a blue circle on a white background", {
        model: "dall-e-3",
        size: "1024x1024",
        requestTimeout: 60000
      });
      console.log("✅ Base image generated. Saving to logo.png...");
      await baseImage.save(logoPath);
    } catch (error) {
      console.error("❌ Failed to generate base image:", error.message);
      return;
    }
  }

  console.log("🎨 Requesting image edit using logo.png...");
  
  try {
    const response = await llm.paint("Add a cute robot head inside the blue circle", {
      model: "gpt-image-1",
      images: [logoPath], // The image to edit
      size: "1024x1024",
      requestTimeout: 60000
    });

    console.log("✅ Image Edit Success!");
    if (response.url) {
      console.log("URL:", response.url);
    } else if (response.isBase64) {
      console.log("Image received as Base64 data.");
    }
    
    // Save the result
    await response.save("edited_logo.png");
    console.log("✅ Saved to edited_logo.png");

  } catch (error) {
    console.error("❌ Image Edit failed:", error.message);
  }
}

main();
