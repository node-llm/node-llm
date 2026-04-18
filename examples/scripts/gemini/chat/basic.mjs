import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  // Pattern: Direct Usage (Singleton)
  // NodeLLM automatically reads NODELLM_PROVIDER=gemini and GEMINI_API_KEY from .env
  const chat = NodeLLM.chat();
  console.log(`Using model: ${chat.modelId}`);

  console.log("Sending message...");
  const response = await chat.ask("Hello, who are you?");

  console.log("\nResponse:");
  console.log(response.content);
  console.log("\nUsage:", response.usage);
}

main().catch(e => { console.error(e); process.exit(1); });
