import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure((config) => {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  });
  
  LLM.configure({ provider: "openai" });

  const chat = LLM.chat("gpt-4o-mini");

  console.log("--- Streaming Request ---");
  for await (const chunk of chat.stream("Write a one-sentence summary of LLMs.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\nDone.");
}

main().catch(console.error);
