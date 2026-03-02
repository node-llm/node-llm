import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("mistral");
  const imageUrl =
    "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";

  console.log("Analyzing image from URL using Pixtral...");

  // Use pixtral-large-latest for vision capabilities
  const response = await llm.chat("pixtral-large-latest").ask("What is in this image?", {
    files: [imageUrl]
  });

  console.log("\nAssistant:", response.content);

  // Example 2: Describe multiple aspects
  console.log("\n--- Detailed Analysis ---");
  const detailed = await llm.chat("pixtral-large-latest").ask(
    "Describe this image in detail: the colors, shapes, and any text you can see.",
    { files: [imageUrl] }
  );

  console.log(detailed.content);
}

main().catch(console.error);
