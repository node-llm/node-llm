import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "deepseek",
    deepseekApiKey: process.env.DEEPSEEK_API_KEY
  });
  const chat = llm.chat("deepseek-chat");

  console.log("Streaming from DeepSeek:\n");

  const stream = chat.stream("Write a short poem about coding.");

  for await (const chunk of stream) {
    process.stdout.write(chunk.content || "");
  }

  console.log("\n\nDone.");
}

main().catch(e => { console.error(e); process.exit(1); });
