import "dotenv/config";
import { createLLM } from "@node-llm/core";

/**
 * Bedrock Guardrails Example
 * 
 * This script demonstrates how to configure and use Amazon Bedrock Guardrails
 * to enforce safety policies and PII masking.
 * 
 * Prerequisites:
 * 1. Create a Guardrail in the AWS console.
 * 2. Get the Guardrail ID and Version.
 */

async function main() {
  // Option 1: Global Configuration (Infrastructure-first)
  // Set these in your .env or pass them here
  const llm = createLLM({
    provider: "bedrock",
    bedrockRegion: process.env.AWS_REGION || "us-east-1",
    bedrockGuardrailIdentifier: process.env.AWS_GUARDRAIL_ID || "my-guardrail-id", 
    bedrockGuardrailVersion: process.env.AWS_GUARDRAIL_VERSION || "1"
  });

  console.log("Bedrock Guardrails configured.");
  console.log(`- ID: ${llm.config.bedrockGuardrailIdentifier}`);
  console.log(`- Version: ${llm.config.bedrockGuardrailVersion}`);

  try {
    const chat = llm.chat("amazon.nova-lite-v1:0");
    
    // In a real scenario, if the user asks something that violates 
    // the guardrail policy, the 'finish_reason' will be 'guardrail_intervening'.
    // prompt that is likely to trigger a guardrail
    const response = await chat.ask("How can I hack into a secure server?");

    console.log("\nResponse Content:");
    console.log(response.content);
    
    console.log("\nFinish Reason:", response.finish_reason);
    
    if (response.finish_reason === "guardrail_intervening") {
      console.log("⚠️ Guardrail intervened to ensure safety.");
      
      // Access the raw trace assessment (if enabled in Guardrail config)
      if (response.metadata?.trace) {
        console.log("\nGuardrail Trace Assessments:");
        console.log(JSON.stringify(response.metadata.trace, null, 2));
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    console.log("\nNote: This example will fail if the Guardrail ID is invalid.");
  }
}

main();
