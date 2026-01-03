import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "gemini" });

  const chat = NodeLLM.chat("gemini-2.0-flash");

  console.log("--- Streaming Request ---");
  for await (const chunk of chat.stream("List 3 features of LLM.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\nDone.");
}

main().catch(console.error);
