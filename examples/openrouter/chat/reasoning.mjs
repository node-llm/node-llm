import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ 
    openrouterApiKey: process.env.OPENROUTER_API_KEY, 
    provider: "openrouter" 
  });

  const chat = LLM.chat("deepseek/deepseek-r1");

  console.log("--- Reasoning Request ---");
  const response = await chat.ask("Solve this puzzle: If I have 3 apples and you take 2, how many apples do YOU have?");
  
  if (response.reasoning) {
    console.log("Reasoning phase:");
    console.log(response.reasoning);
    console.log("\nFinal answer:");
  }
  
  console.log(response.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
