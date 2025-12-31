import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "gemini" });

  const chat = LLM.chat("gemini-2.0-flash");

  // 1. Standard Request
  console.log("--- Standard Request ---");
  const response = await chat.ask("What makes Gemini unique?");
  console.log(response.content);

  // 2. Streaming Request
  console.log("\n--- Streaming Request ---");
  for await (const chunk of chat.stream("List 3 features of Node-LLM.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\nDone.");
}

main().catch(console.error);
