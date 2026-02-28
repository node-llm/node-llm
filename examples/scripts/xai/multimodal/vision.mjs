import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("xai");
  
  // Use a vision-capable model
  const chat = llm.chat("grok-2-vision-1212");

  console.log("Sending image URL to xAI...");
  const response = await chat.ask([
    { type: "text", text: "What colors are in this image?" },
    {
      type: "image_url",
      image_url: { url: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Color-blue.JPG" }
    }
  ]);

  console.log("\nResponse:");
  console.log(response.content);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
