import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

// Ensure ANTHROPIC_API_KEY is set in your environment

async function main() {
  const llm = createLLM({
    provider: "anthropic",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log("Creating chat with Max Tokens limit...");

  // Set max tokens in options
  const chat = llm.chat("claude-3-haiku-20240307");

  console.log("Asking for a long story but limiting to 20 tokens...");
  const response = await chat.ask("Write a very long story about a space adventure.", {
    maxTokens: 20
  });

  console.log("\nResponse (truncated):");
  console.log(response.content);
  console.log("...");
}

main().catch(e => { console.error(e); process.exit(1); });
