import { NodeLLM } from "../../../packages/core/dist/index.js";
import "dotenv/config";

async function main() {
  // Configure OpenAI
  NodeLLM.configure((config) => {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "openai" });

  // Use the o3-mini or o1 model
  // Note: OpenAI reasoning models (o1/o3) do not currently return the full thinking text 
  // via the API. Instead, they provide "reasoning tokens" in the usage metadata.
  const model = "o3-mini"; 
  const chat = NodeLLM.chat(model);

  console.log(`--- Reasoning with ${model} ---`);
  const response = await chat.ask("Explain the logic puzzle: if every A is a B, and some B are C, is every A a C?");
  
  console.log("\x1b[32m[ANSWER]\x1b[0m");
  console.log(response.content);
  console.log("---------------------------------");

  // Show reasoning tokens in usage
  console.log("\x1b[34m[USAGE METADATA]\x1b[0m");
  console.log(`Input Tokens: ${response.usage.input_tokens}`);
  console.log(`Output Tokens: ${response.usage.output_tokens}`);
  
  // Note: OpenAI includes reasoning tokens inside output_tokens, but some versions 
  // might provide a specific reasoning_tokens field in the raw response.
  // node-llm tracks this if the provider reports it.
  if (response.usage.reasoning_tokens) {
    console.log(`Reasoning Tokens: ${response.usage.reasoning_tokens}`);
  }
  
  console.log(`Estimated Cost: $${response.usage.cost}`);
}

main().catch(console.error);
