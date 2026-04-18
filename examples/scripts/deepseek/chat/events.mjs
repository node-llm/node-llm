import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "deepseek",
    deepseekApiKey: process.env.DEEPSEEK_API_KEY
  });
  const chat = llm.chat("deepseek-chat");

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

main().catch(e => { console.error(e); process.exit(1); });
