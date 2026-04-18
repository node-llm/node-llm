import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

// Ensure ANTHROPIC_API_KEY is set in your environment

async function main() {
  const llm = createLLM({
    provider: "anthropic",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log("Creating chat with event handlers...");

  const chat = llm
    .chat("claude-3-haiku-20240307")
    .onNewMessage(() => {
      console.log(">> New message started");
    })
    .onEndMessage((msg) => {
      console.log(`\n>> Message ended. Length: ${msg.content.length}`);
      console.log(
        `>> Token usage: Input=${msg.usage?.input_tokens}, Output=${msg.usage?.output_tokens}`
      );
    });

  console.log("Sending: 'Count from 1 to 5'");
  const response = await chat.ask("Count from 1 to 5");

  console.log("\nFinal Content:", response.content);
}

main().catch(e => { console.error(e); process.exit(1); });
