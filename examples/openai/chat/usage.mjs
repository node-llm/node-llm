import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "openai" });

  const chat = NodeLLM.chat("gpt-4o-mini");

  console.log("Turn 1: Casual conversation...");
  await chat.ask("How are you?");
  console.log(`Usage: In=${chat.totalUsage.input_tokens}, Out=${chat.totalUsage.output_tokens}`);

  console.log("\nTurn 2: Complex request...");
  await chat.ask("Summarize the history of AI in 50 words.");
  
  console.log("\n--- Final Aggregated Session Usage ---");
  console.log(`Input Tokens:  ${chat.totalUsage.input_tokens}`);
  console.log(`Output Tokens: ${chat.totalUsage.output_tokens}`);
  console.log(`Total Tokens:  ${chat.totalUsage.total_tokens}`);
  console.log(`Session Cost:  $${chat.totalUsage.cost?.toFixed(6) || "0.000000"}`);
}

main().catch(console.error);
