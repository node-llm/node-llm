import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  // Configure provider - Callback style (recommended)
  // NodeLLM.configure((config) => {
  //   config.openaiApiKey = process.env.OPENAI_API_KEY;
  // });
  
  // // Alternative: 
   NodeLLM.configure({ openaiApiKey: process.env.OPENAI_API_KEY, provider: "openai" });

  // NodeLLM.configure({ provider: "openai" });

  const chat = NodeLLM.chat("gpt-4o");

  // 1. Standard Request
  console.log("--- Standard Request ---");
  const response = await chat.ask("What is Node.js?");
  console.log(response.content);
}

main().catch(console.error);

