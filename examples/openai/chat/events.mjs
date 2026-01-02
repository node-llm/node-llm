import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure((config) => {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  });
  
  LLM.configure({ provider: "openai" });

  const chat = LLM.chat("gpt-4o-mini");

  // Register Lifecycle Hooks
  chat
    .onNewMessage(() => console.log("🔔 [Event] Model started responding..."))
    .onEndMessage((msg) => console.log(`🔔 [Event] Finished. Total Tokens: ${msg.total_tokens}`))
    .onToolCall((call) => console.log(`🔔 [Event] Tool Called: ${call.function.name}`))
    .onToolResult((res) => console.log(`🔔 [Event] Tool Result Received: ${res}`));

  // 1. Standard Event Triggering
  console.log("--- Standard Turn ---");
  await chat.ask("Hello there!");

  // 2. Events with Streaming
  console.log("\n--- Streaming Turn ---");
  for await (const chunk of chat.stream("Tell me a 3-word story.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("");
}

main().catch(console.error);
