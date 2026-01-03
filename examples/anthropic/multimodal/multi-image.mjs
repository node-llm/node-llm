import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({
    provider: "anthropic",
  });

  const chat = NodeLLM.chat("claude-3-haiku-20240307");

  console.log("Analyzing multiple images...");

  // Two small 1x1 transparent GIFs base64
  const base64Image1 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const base64Image2 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  try {
    const response = await chat.ask([
      { type: "text", text: "Describe these two images and how they differ (if at all)." },
      { type: "image_url", image_url: { url: `data:image/gif;base64,${base64Image1}` } },
      { type: "image_url", image_url: { url: `data:image/gif;base64,${base64Image2}` } }
    ]);

    console.log("Response:", response.content);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
