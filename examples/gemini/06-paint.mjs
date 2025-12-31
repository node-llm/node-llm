import { LLM } from "../../packages/core/dist/index.js";
import "dotenv/config";

LLM.configure({
  provider: "gemini",
});

console.log("Generating image with Imagen 4...");

try {
  const image = await LLM.paint("A futuristic city with flying cars and neon lights, highly detailed, photorealistic", {
    model: "imagen-4.0-generate-001",
    size: "1024x1024"
  });

  console.log("Image generated successfully!");
  console.log(`Mime type: ${image.mimeType}`);
  console.log(`Data length: ${image.data.length} characters`);

  const filename = "futuristic-city.png";
  await image.save(filename);
  console.log(`Image saved to ${filename}`);
} catch (error) {
  console.error("Failed to generate image:", error.message);
  if (error.body) {
    console.error("Error details:", JSON.stringify(error.body, null, 2));
  }
}
