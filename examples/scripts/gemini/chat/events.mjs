import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY
  });
  const chat = llm.chat("gemini-2.0-flash");

  // Register Lifecycle Hooks
  chat
    .onNewMessage(() => process.stdout.write("🔔 [Event] AI Response Start\nAssistant > "))
    .onEndMessage(() => console.log("\n🔔 [Event] AI Response End"));

  // Events with Streaming
  for await (const chunk of chat.stream("Write a haiku.")) {
    process.stdout.write(chunk.content || "");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
