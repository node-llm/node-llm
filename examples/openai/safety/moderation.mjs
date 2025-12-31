import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ 
    provider: "openai",
    defaultModerationModel: "omni-moderation-latest" 
  });

  const input = "I want to hurt someone and steal their money";
  console.log(`Moderating: "${input}"`);
  
  // 1. Basic Check
  const result = await LLM.moderate(input);
  if (result.flagged) {
    console.log(`❌ Flagged for: ${result.flaggedCategories.join(", ")}`);
  } else {
    console.log("✅ Content appears safe");
  }

  // 2. Advanced Risk Assessment (Custom Logic)
  console.log("\n--- Custom Risk Assessment ---");
  const scores = Object.values(result.categoryScores);
  const highRisk = scores.some(score => score > 0.8);

  if (highRisk) {
    console.log("🚨 HIGH RISK DETECTED: Blocking content immediately.");
  } else {
    console.log("Risk acceptable.");
  }
}

main().catch(console.error);
