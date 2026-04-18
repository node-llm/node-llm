import { NodeLLM } from "../../../../packages/core/dist/index.js";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Gemini Inline Image Support ("Nano Banana")
 * 
 * Verifies that Gemini 2.5 Flash Image surfaces inline images as attachments.
 */

async function main() {
  // Confirmed available: gemini-2.5-flash-image, nano-banana-pro-preview
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  
  const llm = NodeLLM.withProvider("gemini", {
    apiKey: process.env.GEMINI_API_KEY
  });

  const chat = llm.chat(model);

  try {
    console.log(`🎨 Requesting image from ${model}...`);
    const reply = await chat.ask("Sketch a Nano Banana wearing aviators. Return the image inline.");

    if (reply.attachments && reply.attachments.length > 0) {
      const image = reply.attachments[0];
      const filename = "nano-banana.png";
      const filepath = path.resolve(__dirname, filename);
      
      fs.writeFileSync(filepath, Buffer.from(image.data, "base64"));
      
      console.log(`✅ Success! Attachment found.`);
      console.log(`MimeType: ${image.mimeType}`);
      console.log(`Saved to: ${filepath}`);
    } else {
      console.log("⚠️ No inline attachments found in the response.");
      console.log("Content received:", reply.content);
    }

  } catch (error) {
    console.error("❌ Gemini Image Fetch failed:", error.message);
  }
}

main();
