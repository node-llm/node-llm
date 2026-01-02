import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  LLM.configure({ provider: "gemini" });

  const chat = LLM.chat("gemini-2.0-flash");

  console.log("--- Streaming Request ---");
  for await (const chunk of chat.stream("List 3 features of Node-LLM.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\nDone.");
}

main().catch(console.error);
