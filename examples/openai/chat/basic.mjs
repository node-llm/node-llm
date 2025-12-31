import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "openai" });

  const chat = LLM.chat("gpt-4o-mini");

  // 1. Standard Request
  console.log("--- Standard Request ---");
  const response = await chat.ask("What is Node.js?");
  console.log(response.content);

  // 2. Streaming Request
  console.log("\n--- Streaming Request ---");
  for await (const chunk of chat.stream("Write a one-sentence summary of LLMs.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\nDone.");
}

main().catch(console.error);
