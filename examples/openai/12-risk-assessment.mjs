import "dotenv/config";
import { LLM } from "../../packages/core/dist/index.js";

/**
 * Assesses content risk using custom thresholds based on category scores.
 * Ported from RubyLLM example.
 */
async function assessContentRisk(text) {
  const result = await LLM.moderate(text);
  const scores = result.categoryScores;

  // Custom thresholds for different risk levels
  const scoresArray = Object.values(scores);
  const highRisk = scoresArray.some(score => score > 0.8);
  const mediumRisk = scoresArray.some(score => score > 0.5);

  if (highRisk) {
    return { risk: "high", action: "block", message: "Content blocked" };
  } else if (mediumRisk) {
    return { risk: "medium", action: "review", message: "Content flagged for review" };
  } else {
    return { risk: "low", action: "allow", message: "Content approved" };
  }
}

async function main() {
  LLM.configure({ provider: "openai" });

  const inputs = [
    "I love programming in Node.js!",
    "This is a bit aggressive but not violent.",
    "I want to hurt someone and steal their money"
  ];

  for (const input of inputs) {
    console.log(`\nAssessing: "${input}"`);
    const assessment = await assessContentRisk(input);
    console.log(`Risk level: ${assessment.risk.toUpperCase()}`);
    console.log(`Action: ${assessment.action.toUpperCase()}`);
    console.log(`Message: ${assessment.message}`);
  }
}

main().catch(console.error);
