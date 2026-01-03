import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "openai" });

  const chat = NodeLLM.chat("gpt-4o-mini");

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
