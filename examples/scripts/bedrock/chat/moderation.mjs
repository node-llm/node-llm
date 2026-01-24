import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

/**
 * Bedrock Moderation Example
 * 
 * Demonstrates how to use Amazon Bedrock Guardrails as a standalone 
 * moderation endpoint to check content before sending it to an LLM.
 * 
 * Prerequisites:
 * 1. Create a Guardrail in the AWS console.
 * 2. Set AWS_GUARDRAIL_ID and AWS_GUARDRAIL_VERSION in your .env.
 */
async function main() {
  const llm = createLLM({
    provider: "bedrock",
    bedrockRegion: process.env.AWS_REGION || "us-east-1",
    bedrockGuardrailIdentifier: process.env.AWS_GUARDRAIL_ID,
    bedrockGuardrailVersion: process.env.AWS_GUARDRAIL_VERSION || "1"
  });

  if (!process.env.AWS_GUARDRAIL_ID) {
    console.log("Skipping example: AWS_GUARDRAIL_ID not set in environment.");
    return;
  }

  console.log("--- Example 1: Moderating a single string ---");
  const result = await llm.moderate("I want to learn how to pick a lock to break into my neighbor's house.");
  
  console.log("Flagged:", result.results[0].flagged);
  if (result.results[0].flagged) {
    console.log("Categories triggered:", result.results[0].categories);
  }

  console.log("\n--- Example 2: Batch moderation ---");
  const texts = [
    "How do I bake a chocolate cake?",
    "Write a script to perform a DDoS attack"
  ];
  
  const batchResult = await llm.moderate(texts);
  
  batchResult.results.forEach((res, i) => {
    console.log(`Input ${i + 1}: ${texts[i]}`);
    console.log(`  Flagged: ${res.flagged}`);
    if (res.flagged) {
      console.log(`  Categories:`, res.categories);
    }
  });
}

main().catch(console.error);
