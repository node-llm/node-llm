import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  // Configure provider - Callback style (recommended)
  LLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  // Alternative: LLM.configure({ geminiApiKey: "...", provider: "gemini" });
  LLM.configure({ provider: "gemini" });

  const chat = LLM.chat("gemini-2.0-flash");

  // 1. Standard Request
  console.log("--- Standard Request ---");
  const response = await chat.ask("What makes Gemini unique?");
  console.log(response.content);
}

main().catch(console.error);
