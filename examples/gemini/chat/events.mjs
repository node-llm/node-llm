import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  LLM.configure({ provider: "gemini" });

  const chat = LLM.chat("gemini-2.0-flash");

  // Register Lifecycle Hooks
  chat
    .onNewMessage(() => process.stdout.write("🔔 [Event] AI Response Start\nAssistant > "))
    .onEndMessage(() => console.log("\n🔔 [Event] AI Response End"));

  // Events with Streaming
  for await (const chunk of chat.stream("Write a haiku.")) {
    process.stdout.write(chunk.content || "");
  }
}

main().catch(console.error);
