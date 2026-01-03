import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ 
    openrouterApiKey: process.env.OPENROUTER_API_KEY, 
    provider: "openrouter" 
  });

  const chat = LLM.chat("openai/gpt-4o-mini");

  console.log("--- Vision Request ---");
  const response = await chat.ask("What's in this image?", {
    files: ["https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"]
  });

  console.log(response.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
