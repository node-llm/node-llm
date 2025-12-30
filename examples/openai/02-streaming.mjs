import "dotenv/config";
import { LLM } from "../../packages/core/dist/index.js";

LLM.configure({ 
  provider: "openai"
});

async function main() {
  const chat = LLM.chat("gpt-4o-mini");

  console.log("Streaming response...");
  for await (const chunk of chat.stream("Write a short poem about Node.js")) {
    process.stdout.write(chunk.content);
  }
  console.log("\nDone.");
}

main();
