import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "deepseek" });

  const chat = LLM.chat("deepseek-chat");

  console.log("Asking for a long story but limiting to 50 tokens...\n");

  const response = await chat.ask("Write a 500 word story about a space whale.", {
    maxTokens: 50
  });

  console.log("Response:");
  console.log(response.content);
  console.log("\n[Note: The response should be cut off mid-sentence]");
  console.log(`Generated Tokens: ${response.usage.output_tokens}`);
}

main().catch(console.error);
