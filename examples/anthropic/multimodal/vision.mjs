import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({
    provider: "anthropic",
  });

  const chat = NodeLLM.chat("claude-3-haiku-20240307");

  console.log("Analyzing image...");

  // A small 1x1 transparent GIF base64
  const base64Image = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  try {
    const response = await chat.ask([
      { type: "text", text: "What is in this image?" },
      { type: "image_url", image_url: { url: `data:image/gif;base64,${base64Image}` } }
    ]);

    console.log("Response:", response.content);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
