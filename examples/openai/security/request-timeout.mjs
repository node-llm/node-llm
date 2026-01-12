/**
 * Request Timeout Configuration Example
 * 
 * This example demonstrates how to configure request timeouts at different levels:
 * - Global configuration (applies to all requests)
 * - Per-chat configuration (applies to all requests in that chat)
 * - Per-request configuration (applies to a single request)
 * 
 * Timeouts are a critical security feature that prevent:
 * - Hanging requests that tie up resources
 * - Denial of Service (DoS) attacks
 * - Runaway costs from long-running requests
 */

import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

// ============================================
// 1. Global Timeout Configuration
// ============================================

// Set a global timeout for all requests (default is 30 seconds)
NodeLLM.configure({
  provider: "openai",
  requestTimeout: 45000, // 45 seconds for all requests
});

const chat = NodeLLM.chat("gpt-4o");

console.log("Example 1: Using global timeout (45s)");
try {
  const response = await chat.ask("What is the capital of France?");
  console.log("Response:", response.content);
} catch (error) {
  if (error.message.includes("timeout")) {
    console.error("Request timed out after 45 seconds");
  }
}

// ============================================
// 2. Per-Chat Timeout Configuration
// ============================================

// Override timeout for a specific chat instance
const longRunningChat = NodeLLM.chat("gpt-4o", {
  requestTimeout: 120000, // 2 minutes for this chat
});

console.log("\nExample 2: Per-chat timeout (2 minutes)");
const response2 = await longRunningChat.ask("Explain quantum computing in detail");
console.log("Response:", response2.content.substring(0, 100) + "...");

// ============================================
// 3. Per-Request Timeout Configuration
// ============================================

// Override timeout for a single request
console.log("\nExample 3: Per-request timeout (10 seconds)");
try {
  const response3 = await chat.ask("Quick question: What is 2+2?", {
    requestTimeout: 10000, // 10 seconds for this specific request
  });
  console.log("Response:", response3.content);
} catch (error) {
  if (error.message.includes("timeout")) {
    console.error("Request timed out after 10 seconds");
  }
}

// ============================================
// 4. Streaming with Timeout
// ============================================

console.log("\nExample 4: Streaming with timeout");
const stream = chat.stream("Tell me a short story");

try {
  for await (const chunk of stream) {
    process.stdout.write(chunk.content);
  }
  console.log("\n✓ Stream completed successfully");
} catch (error) {
  if (error.message.includes("timeout")) {
    console.error("\n✗ Stream timed out");
  }
}

// ============================================
// 5. Security Best Practices
// ============================================

console.log("\n\n=== Security Best Practices ===");
console.log("1. Set a reasonable global timeout (30-60 seconds)");
console.log("2. Use shorter timeouts for user-facing requests");
console.log("3. Use longer timeouts for background/batch processing");
console.log("4. Always handle timeout errors gracefully");
console.log("5. Combine with maxRetries and maxToolCalls for defense-in-depth");

// Example: Complete security configuration
NodeLLM.configure({
  requestTimeout: 30000,  // 30 second timeout
  maxRetries: 2,          // Retry failed requests twice
  maxToolCalls: 5,        // Limit tool execution loops
});

console.log("\n✓ Security limits configured:");
console.log("  - Request timeout: 30s");
console.log("  - Max retries: 2");
console.log("  - Max tool calls: 5");
