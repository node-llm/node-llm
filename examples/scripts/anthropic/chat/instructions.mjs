import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

// Ensure ANTHROPIC_API_KEY is set in your environment

async function main() {
  const llm = createLLM({
    provider: "anthropic",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log("Creating chat with System Prompt...");

  // You can set a system prompt using .withSystemPrompt() or in options
  const chat = llm
    .chat("claude-3-haiku-20240307")
    .withSystemPrompt("You are a helpful assistant who speaks like a pirate. Arrr!");

  console.log("Sending message: 'Tell me a joke'");
  const response = await chat.ask("Tell me a joke");

  console.log("\nResponse:");
  console.log(response.content);
}

main().catch(e => { console.error(e); process.exit(1); });
