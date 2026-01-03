import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({
    provider: "gemini",
  });

  const chat = NodeLLM.chat("gemini-2.0-flash");

  console.log("Asking with maxTokens: 10...");

  const response = await chat.ask("Write a long story about a cat.", {
    maxTokens: 10
  });

  console.log("Response:", response.content);
  console.log("Usage:", response.usage);
}

main().catch(console.error);
