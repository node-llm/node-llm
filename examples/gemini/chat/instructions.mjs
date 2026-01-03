import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "gemini" });

  // 1. Behavior Tuning with System Prompts
  console.log("--- System Instructions ---");
  const chat = NodeLLM.chat("gemini-2.0-flash").withInstructions(
    "You are a poetic assistant. Reply in rhymes."
  );

  const response1 = await chat.ask("Hello!");
  console.log(`Assistant: ${response1.content}`);

  // 2. Creativity Control with Temperature
  console.log("\n--- Creative vs Deterministic ---");
  const factual = NodeLLM.chat("gemini-2.0-flash").withTemperature(0.1);
  console.log("Factual (Temp 0.1):");
  console.log((await factual.ask("What is the capital of France?")).content);
}

main().catch(console.error);
