import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure((config) => {
    config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  });
  
  LLM.configure({ provider: "deepseek" });
  const chat = LLM.chat("deepseek-chat");

  console.log("Streaming from DeepSeek:\n");
  
  const stream = chat.stream("Write a short poem about coding.");
  
  for await (const chunk of stream) {
    process.stdout.write(chunk.content || "");
  }
  
  console.log("\n\nDone.");
}

main().catch(console.error);
