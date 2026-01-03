import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({ 
    openrouterApiKey: process.env.OPENROUTER_API_KEY, 
    provider: "openrouter" 
  });

  const chat = NodeLLM.chat("openai/gpt-4o-mini");

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
