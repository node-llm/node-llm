import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("mistral");

  const input = "I want to hurt someone and steal their money";
  console.log(`Moderating: "${input}"`);

  // 1. Basic Check
  const result = await llm.moderate(input);
  if (result.flagged) {
    console.log(`❌ Flagged for: ${result.flaggedCategories.join(", ")}`);
  } else {
    console.log("✅ Content appears safe");
  }

  // 2. Advanced Risk Assessment
  console.log("\n--- Custom Risk Assessment ---");
  const scores = Object.values(result.categoryScores);
  const highRisk = scores.some((score) => score > 0.8);

  if (highRisk) {
    console.log("🚨 HIGH RISK DETECTED: Blocking content immediately.");
  } else {
    console.log("Risk acceptable.");
  }

  // 3. Batch moderation
  console.log("\n--- Batch Moderation ---");
  const texts = [
    "Hello, how are you?",
    "I hate everyone",
    "The weather is nice today"
  ];

  for (const text of texts) {
    const res = await llm.moderate(text);
    const status = res.flagged ? "❌ Flagged" : "✅ Safe";
    console.log(`${status}: "${text}"`);
  }
}

main().catch(console.error);
