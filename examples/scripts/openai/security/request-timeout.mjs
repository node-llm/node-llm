/**
 * Request Timeout Configuration Example
 */

import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  // ============================================
  // 1. Global Timeout Configuration
  // ============================================

  // Set a global timeout for all requests via createLLM
  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY,
    requestTimeout: 45000 // 45 seconds for all requests
  });

  const chat = llm.chat("gpt-4o-mini");

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
  const longRunningChat = llm.chat("gpt-4o-mini", {
    requestTimeout: 120000 // 2 minutes for this chat
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
      requestTimeout: 10000 // 10 seconds for this specific request
    });
    console.log("Response:", response3.content);
  } catch (error) {
    if (error.message.includes("timeout")) {
      console.error("Request timed out after 10 seconds");
    }
  }

  console.log("\n✓ All timeout patterns demonstrated");
}

main().catch(e => { console.error(e); process.exit(1); });
