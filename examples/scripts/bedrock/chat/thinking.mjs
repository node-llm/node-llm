import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

/**
 * Bedrock Extended Thinking Example
 * 
 * Demonstrates native reasoning (Chain of Thought) using Claude 3.7 Sonnet.
 * Uses .withThinking() to enable the reasoning budget.
 */
async function main() {
  const llm = createLLM({
    provider: "bedrock",
    region: process.env.AWS_REGION || "us-east-1",
  });

  // Claude 3.7 Sonnet is the first Bedrock model to support the native thinking budget
  const modelId = "anthropic.claude-3-7-sonnet-20250219-v1:0";

  console.log(`--- Requesting with Extended Thinking (${modelId}) ---`);
  console.log("(Note: This requires model access in your AWS Bedrock console)\n");
  
  try {
    const response = await llm.chat(modelId)
      .withThinking({ budget: 1024 }) // Enable 1024 tokens of thinking budget
      .ask("Research and explain the mathematical relationship between prime number distribution and the Riemann Hypothesis.");

    console.log("--- Thinking Process ---");
    console.log(response.thinking?.text || "No reasoning returned or model doesn't support the requested thinking parameters.");
    
    console.log("\n--- Final Answer ---");
    console.log(response.content);
    
    console.log("\nUsage:", response.usage);
  } catch (error) {
    if (error.message.includes("UnrecognizedClientException") || error.message.includes("AccessDenied")) {
      console.log("\n[Note] This example failed due to credentials or model access. This is expected if Claude 3.7 is not enabled in your region.");
    } else {
      console.error("Error:", error.message);
    }
  }
}

main().catch(console.error);
