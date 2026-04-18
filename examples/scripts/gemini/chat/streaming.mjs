import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY
  });
  const chat = llm.chat("gemini-2.0-flash");

  console.log("--- Streaming Request ---");
  for await (const chunk of chat.stream("List 3 features of LLM.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\nDone.");
}

main().catch(e => { console.error(e); process.exit(1); });
