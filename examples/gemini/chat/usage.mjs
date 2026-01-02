import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  LLM.configure({ provider: "gemini" });

  const chat = LLM.chat("gemini-2.0-flash");

  console.log("Turn 1...");
  await chat.ask("What is a star?");
  console.log(`Usage: In=${chat.totalUsage.input_tokens}, Out=${chat.totalUsage.output_tokens}`);

  console.log("\nTurn 2...");
  await chat.ask("How long does it live?");
  
  console.log("\n--- Total Conversation Usage ---");
  console.log(`Total Tokens: ${chat.totalUsage.total_tokens}`);
}

main().catch(console.error);
