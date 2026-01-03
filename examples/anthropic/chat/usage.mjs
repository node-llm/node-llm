import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

// Ensure ANTHROPIC_API_KEY is set in your environment

NodeLLM.configure({
  provider: "anthropic",
});

async function main() {
  console.log("Creating chat to inspect usage...");
  
  const chat = NodeLLM.chat("claude-3-haiku-20240307");

  const response1 = await chat.ask("What is 2+2?");
  console.log("Round 1 Usage:", response1.usage);

  const response2 = await chat.ask("What is the square root of that?");
  console.log("Round 2 Usage:", response2.usage);

  console.log("\nTotal Session Usage:", chat.totalUsage);
}

main().catch(console.error);
