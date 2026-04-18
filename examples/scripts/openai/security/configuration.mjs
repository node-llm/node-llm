/**
 * Complete Security Configuration Example
 */

import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  // ============================================
  // Complete Security Configuration
  // ============================================

  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY,

    // Security Limits (Defense-in-Depth)
    requestTimeout: 30000, // 30 second timeout (prevents DoS)
    maxRetries: 2, // Retry failed requests twice (prevents retry storms)
    maxToolCalls: 5, // Limit tool execution loops (prevents infinite loops)
    maxTokens: 4096 // Limit output to 4K tokens (prevents cost overruns)
  });

  console.log("✓ Security limits configured:");
  console.log("  - Request timeout: 30s");
  console.log("  - Max retries: 2");
  console.log("  - Max tool calls: 5");
  console.log("  - Max tokens: 4K");

  // ============================================
  // Example 1: Global Limits in Action
  // ============================================

  console.log("\n=== Example 1: Using Global Limits ===");
  const chat = llm.chat("gpt-4o-mini");

  try {
    const response = await chat.ask("Explain quantum computing briefly");
    console.log("Response:", response.content.substring(0, 100) + "...");
    console.log("Tokens used:", response.usage.total_tokens);
    console.log("✓ Request completed within all limits");
  } catch (error) {
    if (error.message.includes("timeout")) {
      console.error("✗ Request timed out after 30 seconds");
    } else if (error.message.includes("Maximum tool")) {
      console.error("✗ Hit tool execution limit");
    }
  }

  // ============================================
  // Example 2: Per-Request Overrides
  // ============================================

  console.log("\n=== Example 2: Per-Request Overrides ===");

  // Long-running task with extended limits
  const longTask = await chat.ask("Write a comprehensive guide on Node.js", {
    requestTimeout: 120000, // 2 minutes for this request
    maxTokens: 16384 // 16K tokens for detailed response
  });

  console.log("Long task completed:");
  console.log("  - Tokens:", longTask.usage.total_tokens);
  console.log("  - Within custom limits");

  // Quick task with strict limits
  const quickTask = await chat.ask("What is 2+2?", {
    requestTimeout: 5000, // 5 seconds max
    maxTokens: 100 // Very brief response
  });

  console.log("\nQuick task completed:");
  console.log("  - Response:", quickTask.content);
  console.log("  - Tokens:", quickTask.usage.total_tokens);

  console.log("\n✓ All security patterns demonstrated");
}

main().catch(e => { console.error(e); process.exit(1); });
