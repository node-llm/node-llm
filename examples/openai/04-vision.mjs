import "dotenv/config";
import { LLM } from "../../packages/core/dist/index.js";

LLM.configure({ 
  provider: "openai"
});

async function main() {
  const chat = LLM.chat("gpt-4o-mini");

  console.log("Analyzing image...");
  try {
    const reply = await chat.ask("What is in this image?", {
      files: ["https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"]
    });
    console.log("Reply:", reply.content);
  } catch (e) {
    console.error("Vision test failed (possibly due to image availability):", e.message);
  }
}

main();
