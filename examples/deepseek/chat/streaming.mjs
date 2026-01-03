import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  });
  
  NodeLLM.configure({ provider: "deepseek" });
  const chat = NodeLLM.chat("deepseek-chat");

  console.log("Streaming from DeepSeek:\n");
  
  const stream = chat.stream("Write a short poem about coding.");
  
  for await (const chunk of stream) {
    process.stdout.write(chunk.content || "");
  }
  
  console.log("\n\nDone.");
}

main().catch(console.error);
