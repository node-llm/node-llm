import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

// Ensure ANTHROPIC_API_KEY is set in your environment
// export ANTHROPIC_API_KEY=sk-ant-...

async function main() {
  const llm = createLLM({
    provider: "anthropic",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log("Creating chat with Streaming...");
  const chat = llm.chat("claude-3-haiku-20240307");

  console.log("Streaming response for: 'Write a haiku about code'");
  console.log("\n--- Start of Stream ---\n");

  const stream = chat.stream("Write a haiku about code");

  for await (const chunk of stream) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }

  console.log("\n\n--- End of Stream ---");
}

main().catch(e => { console.error(e); process.exit(1); });
