import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

// Ensure ANTHROPIC_API_KEY is set in your environment

async function main() {
  const llm = createLLM({
    provider: "anthropic",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log("Creating chat to inspect usage...");

  const chat = llm.chat("claude-3-haiku-20240307");

  const response1 = await chat.ask("What is 2+2?");
  console.log("Round 1 Usage:", response1.usage);

  const response2 = await chat.ask("What is the square root of that?");
  console.log("Round 2 Usage:", response2.usage);

  console.log("\nTotal Session Usage:", chat.totalUsage);
}

main().catch(e => { console.error(e); process.exit(1); });
