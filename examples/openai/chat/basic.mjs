import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  // Configure provider - Callback style (recommended)
  // LLM.configure((config) => {
  //   config.openaiApiKey = process.env.OPENAI_API_KEY;
  // });
  
  // // Alternative: 
   LLM.configure({ openaiApiKey: process.env.OPENAI_API_KEY, provider: "openai" });

  // LLM.configure({ provider: "openai" });

  const chat = LLM.chat("gpt-4o-mini");

  // 1. Standard Request
  console.log("--- Standard Request ---");
  const response = await chat.ask("What is Node.js?");
  console.log(response.content);
}

main().catch(console.error);
