import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "gemini" });

  const chat = NodeLLM.chat("gemini-2.0-flash");

  console.log("Turn 1...");
  await chat.ask("What is a star?");
  console.log(`Usage: In=${chat.totalUsage.input_tokens}, Out=${chat.totalUsage.output_tokens}`);

  console.log("\nTurn 2...");
  await chat.ask("How long does it live?");
  
  console.log("\n--- Total Conversation Usage ---");
  console.log(`Total Tokens: ${chat.totalUsage.total_tokens}`);
}

main().catch(console.error);
