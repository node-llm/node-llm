import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "deepseek",
    deepseekApiKey: process.env.DEEPSEEK_API_KEY
  });
  const chat = llm.chat("deepseek-chat");

  console.log("Asking for a long story but limiting to 50 tokens...\n");

  const response = await chat.ask("Write a 500 word story about a space whale.", {
    maxTokens: 50
  });

  console.log("Response:");
  console.log(response.content);
  console.log("\n[Note: The response should be cut off mid-sentence]");
  console.log(`Generated Tokens: ${response.usage.output_tokens}`);
}

main().catch(e => { console.error(e); process.exit(1); });
