import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

// Ensure ANTHROPIC_API_KEY is set in your environment
// export ANTHROPIC_API_KEY=sk-ant-...

NodeLLM.configure({
  provider: "anthropic",
});

async function main() {
  console.log("Creating chat with Streaming...");
  const chat = NodeLLM.chat("claude-3-haiku-20240307");

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

main().catch(console.error);
