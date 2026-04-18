import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY
  });
  const chat = llm.chat("gemini-2.0-flash");

  console.log("Asking with maxTokens: 10...");

  const response = await chat.ask("Write a long story about a cat.", {
    maxTokens: 10
  });

  console.log("Response:", response.content);
  console.log("Usage:", response.usage);
}

main().catch(e => { console.error(e); process.exit(1); });
