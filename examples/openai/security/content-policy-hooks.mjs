import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

/**
 * Example: Content Policy Hooks
 * 
 * Demonstrates:
 * 1. beforeRequest: Redacting PII (Social Security Numbers) before sending to LLM.
 * 2. afterResponse: Redacting sensitive output or enforcing compliance.
 * 
 * This provides a flexible, non-opinionated way to implement security layers
 * without hard-coding moderation into the library.
 */

async function main() {
  NodeLLM.configure({ 
    provider: "openai", 
    openaiApiKey: process.env.OPENAI_API_KEY 
  });

  const chat = NodeLLM.chat("gpt-4o-mini");

  // --- 1. Input Policy (PII Redaction) ---
  chat.beforeRequest(async (messages) => {
    console.log("[Policy] Checking for PII in request...");
    
    return messages.map(msg => {
      if (typeof msg.content === "string") {
        // Simple regex for SSN-like patterns (e.g., 000-00-0000)
        const redacted = msg.content.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[Redacted SSN]");
        if (redacted !== msg.content) {
          console.log("[Policy] Found and redacted PII in user message.");
        }
        return { ...msg, content: redacted };
      }
      return msg;
    });
  });

  // --- 2. Output Policy (Sensitive Content Masking) ---
  chat.afterResponse(async (response) => {
    console.log("[Policy] Checking for sensitive info in AI response...");
    
    // Example: Redact certain "Internal Project Names"
    const redactedContent = response.content.replace(/Project X-Ray/gi, "[INTERNAL-PROJECT]");
    
    if (redactedContent !== response.content) {
      console.log("[Policy] Redacted sensitive project name from output.");
      
      // Use the helper method to return modified content while preserving metadata
      return response.withContent(redactedContent);
    }
  });

  console.log("\n--- Scenario 1: User sends an SSN ---");
  const res1 = await chat.ask("Hello, my identification number is 123-45-6789. Can you help me?");
  // The LLM will only see: "Hello, my identification number is [Redacted SSN]. Can you help me?"
  console.log("Response:", res1.content);

  console.log("\n--- Scenario 2: AI mentions a secret project ---");
  const res2 = await chat.ask("What is the name of the secret project we are working on? Mention Project X-Ray.");
  // The user will see: "... [INTERNAL-PROJECT]"
  console.log("Response:", res2.content);
}

main().catch(console.error);
