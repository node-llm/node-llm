import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  // Configure provider
  LLM.configure({ 
    openrouterApiKey: process.env.OPENROUTER_API_KEY, 
    provider: "openrouter" 
  });

  const chat = LLM.chat("openai/gpt-4o-mini");

  // 1. Standard Request
  console.log("--- Standard Request ---");
  const response = await chat.ask("What is OpenRouter?");
  console.log(response.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
