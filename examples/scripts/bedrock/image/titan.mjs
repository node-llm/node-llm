import "dotenv/config";
import { createLLM } from "@node-llm/core";
import fs from "fs/promises";
import path from "path";

/**
 * Bedrock Image Generation Example
 * 
 * Generates an image using Amazon Titan Image Generator.
 */
async function main() {
  const llm = createLLM({
    provider: "bedrock",
    bedrockRegion: process.env.AWS_REGION || "us-east-1"
  });

  console.log("Generating image with Amazon Titan...");

  try {
    const response = await llm.paint(
      "A futuristic city with flying cars and neon lights, high quality, 4k",
      {
        model: "amazon.titan-image-generator-v2:0",
        size: "1024x1024"
      }
    );

    if (response.data) {
      const outputPath = path.resolve(process.cwd(), "generated-image.png");
      await fs.writeFile(outputPath, Buffer.from(response.data, "base64"));
      
      console.log("\n✅ Image generated successfully!");
      console.log(`- Path: ${outputPath}`);
      console.log(`- Format: ${response.mimeType}`);
    } else {
      console.log("No image data received.");
    }
  } catch (error) {
    console.error("\n❌ Error generating image:");
    console.error(error.message);
  }
}

main();
