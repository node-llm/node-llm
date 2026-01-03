import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  // Configure provider
  NodeLLM.configure({ 
    openrouterApiKey: process.env.OPENROUTER_API_KEY, 
    provider: "openrouter" 
  });

  const chat = NodeLLM.chat("gpt-4o-mini");

  // 1. Standard Request
  console.log("--- Standard Request ---");
  const response = await chat.ask("What is OpenRouter?");
  console.log(response.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
