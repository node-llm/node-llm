import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ 
    openrouterApiKey: process.env.OPENROUTER_API_KEY, 
    provider: "openrouter" 
  });

  const chat = LLM.chat("openai/gpt-4o-mini");

  console.log("--- Streaming Request ---");
  for await (const chunk of chat.stream("Write a short poem about the ocean.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
