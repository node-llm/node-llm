import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({
    provider: "gemini",
  });

  const chat = LLM.chat("gemini-1.5-flash");

  console.log("Asking with maxTokens: 10...");

  const response = await chat.ask("Write a long story about a cat.", {
    maxTokens: 10
  });

  console.log("Response:", response.content);
  console.log("Usage:", response.usage);
}

main().catch(console.error);
