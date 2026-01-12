/**
 * Complete Security Configuration Example
 * 
 * This example demonstrates all four security limits in NodeLLM:
 * 1. requestTimeout - Prevents hanging requests and DoS attacks
 * 2. maxRetries - Prevents retry storms during outages
 * 3. maxToolCalls - Prevents infinite tool execution loops
 * 4. maxTokens - Prevents excessive output generation and cost overruns
 */

import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

// ============================================
// Complete Security Configuration
// ============================================

NodeLLM.configure({
  provider: "openai",
  
  // Security Limits (Defense-in-Depth)
  requestTimeout: 30000,  // 30 second timeout (prevents DoS)
  maxRetries: 2,          // Retry failed requests twice (prevents retry storms)
  maxToolCalls: 5,        // Limit tool execution loops (prevents infinite loops)
  maxTokens: 4096,        // Limit output to 4K tokens (prevents cost overruns)
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
const chat = NodeLLM.chat("gpt-4o");

try {
  const response = await chat.ask("Explain quantum computing briefly");
  console.log("Response:", response.content.substring(0, 100) + "...");
  console.log("Tokens used:", response.total_tokens);
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
  requestTimeout: 120000,  // 2 minutes for this request
  maxTokens: 16384,        // 16K tokens for detailed response
});

console.log("Long task completed:");
console.log("  - Tokens:", longTask.total_tokens);
console.log("  - Within custom limits");

// Quick task with strict limits
const quickTask = await chat.ask("What is 2+2?", {
  requestTimeout: 5000,    // 5 seconds max
  maxTokens: 100,          // Very brief response
});

console.log("\nQuick task completed:");
console.log("  - Response:", quickTask.content);
console.log("  - Tokens:", quickTask.total_tokens);

// ============================================
// Example 3: Per-Chat Configuration
// ============================================

console.log("\n=== Example 3: Per-Chat Configuration ===");

// Create a chat with custom limits for this conversation
const restrictedChat = NodeLLM.chat("gpt-4o", {
  maxTokens: 2048,         // Limit all responses to 2K tokens
  maxToolCalls: 3,         // Only allow 3 tool calls
});

const response3 = await restrictedChat.ask("Explain machine learning");
console.log("Restricted chat response:", response3.content.substring(0, 80) + "...");
console.log("Tokens:", response3.total_tokens, "/ 2048 limit");

// ============================================
// Example 4: Security in Multi-Tenant Apps
// ============================================

console.log("\n=== Example 4: Multi-Tenant Security ===");

// Different limits for different user tiers
const freeUserChat = NodeLLM.chat("gpt-4o", {
  maxTokens: 1024,         // Free tier: 1K tokens
  requestTimeout: 15000,   // Free tier: 15s timeout
});

const premiumUserChat = NodeLLM.chat("gpt-4o", {
  maxTokens: 8192,         // Premium tier: 8K tokens
  requestTimeout: 60000,   // Premium tier: 60s timeout
});

console.log("Free tier limits: 1K tokens, 15s timeout");
console.log("Premium tier limits: 8K tokens, 60s timeout");

// ============================================
// Example 5: Cost Control
// ============================================

console.log("\n=== Example 5: Cost Control ===");

// Estimate costs by limiting tokens
const costControlledChat = NodeLLM.chat("gpt-4o", {
  maxTokens: 500,  // Strict limit for cost control
});

console.log("Cost-controlled chat configured:");
console.log("  - Max 500 tokens per response");
console.log("  - Predictable cost per request");
console.log("  - Prevents prompt injection attacks requesting massive output");

// ============================================
// Security Best Practices Summary
// ============================================

console.log("\n\n=== Security Best Practices ===");
console.log("1. Always set global limits as a baseline");
console.log("2. Use stricter limits for untrusted user input");
console.log("3. Increase limits only for specific trusted operations");
console.log("4. Monitor token usage to detect anomalies");
console.log("5. Combine all four limits for defense-in-depth");
console.log("\n✓ Complete security configuration example finished!");
