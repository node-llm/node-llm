import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "openai" });

  // 1. Behavior Tuning with System Prompts
  console.log("--- System Instructions ---");
  const chat = LLM.chat("gpt-4o-mini").withInstructions(
    "You are a strictly professional assistant. Keep answers under 20 words."
  );

  const response1 = await chat.ask("What is the meaning of life?");
  console.log(`Assistant: ${response1.content}`);

  // 2. Creativity Control with Temperature
  console.log("\n--- Creative vs Deterministic ---");
  
  const factual = LLM.chat("gpt-4o-mini").withTemperature(0.1);
  const creative = LLM.chat("gpt-4o-mini").withTemperature(0.9);

  console.log("Factual (Temp 0.1):");
  console.log((await factual.ask("Suggest a Name for a new Coffee Shop.")).content);

  console.log("\nCreative (Temp 0.9):");
  console.log((await creative.ask("Suggest a Name for a new Coffee Shop.")).content);
}

main().catch(console.error);
