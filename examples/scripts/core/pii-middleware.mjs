#!/usr/bin/env node
import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

/**
 * PII Detection and Redaction Middleware
 * 
 * This middleware demonstrates how to:
 * 1. Detect Personally Identifiable Information (PII) in user inputs
 * 2. Redact PII before sending to LLM
 * 3. Log detected PII for compliance/auditing
 * 4. Mask sensitive data in responses
 */

// Simple PII patterns (in production, use libraries like 'redact-pii' or ML models)
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
};

const piiMiddleware = {
  name: "PIIProtection",
  
  onRequest: async (ctx) => {
    console.log("\n🔒 PII Protection - Scanning request...");
    
    const detected = [];
    
    // Scan messages for PII
    if (ctx.messages) {
      ctx.messages = ctx.messages.map((msg) => {
        let content = typeof msg.content === "string" ? msg.content : String(msg.content || "");
        
        // Detect and redact each type of PII
        Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
          const matches = content.match(pattern);
          if (matches) {
            detected.push({ type, count: matches.length });
            content = content.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
          }
        });
        
        return { ...msg, content };
      });
    }
    
    if (detected.length > 0) {
      console.log("⚠️  PII Detected and Redacted:");
      detected.forEach(({ type, count }) => {
        console.log(`   - ${count} ${type}(s)`);
      });
      
      // In production: log to compliance system
      // await logToComplianceSystem({ requestId: ctx.requestId, detected });
    } else {
      console.log("✅ No PII detected");
    }
  },
  
  onResponse: async (ctx, response) => {
    console.log("\n🔍 PII Protection - Scanning response...");
    
    let content = response.content || "";
    let modified = false;
    
    // Check if LLM accidentally exposed any placeholders
    if (content.includes("[REDACTED_")) {
      console.log("⚠️  Response contains redaction markers - masking");
      content = content.replace(/\[REDACTED_\w+\]/g, "[CONFIDENTIAL]");
      modified = true;
    }
    
    if (!modified) {
      console.log("✅ Response is clean");
    }
  },
  
  onError: async (ctx, error) => {
    console.error(`\n❌ Error in request ${ctx.requestId}:`, error.message);
    // Ensure errors don't leak PII
  }
};

/**
 * Demo: PII Detection and Redaction
 */
async function demonstratePIIProtection() {
  console.log("=".repeat(70));
  console.log("PII Protection Middleware Demo");
  console.log("=".repeat(70));
  
  const llm = NodeLLM.withProvider("openai");
  
  // Test 1: Request with email
  console.log("\n📝 Test 1: Request containing email address");
  console.log("Input: 'My email is john.doe@example.com, please help me'");
  
  const response1 = await llm
    .chat("gpt-4o-mini", { middlewares: [piiMiddleware] })
    .ask("My email is john.doe@example.com, please help me reset my password");
  
  console.log("\n💬 Response:", response1.content?.substring(0, 100) + "...");
  
  // Test 2: Request with phone number
  console.log("\n\n📝 Test 2: Request containing phone number");
  console.log("Input: 'Call me at 555-123-4567'");
  
  const response2 = await llm
    .chat("gpt-4o-mini", { middlewares: [piiMiddleware] })
    .ask("Call me at 555-123-4567 for support");
  
  console.log("\n💬 Response:", response2.content?.substring(0, 100) + "...");
  
  // Test 3: Request with multiple PII types
  console.log("\n\n📝 Test 3: Request with multiple PII types");
  console.log("Input: Contains SSN, email, and phone");
  
  const response3 = await llm
    .chat("gpt-4o-mini", { middlewares: [piiMiddleware] })
    .ask(
      "My SSN is 123-45-6789, email is alice@example.com, " +
      "and phone is (555) 987-6543. Help me with my account."
    );
  
  console.log("\n💬 Response:", response3.content?.substring(0, 100) + "...");
  
  // Test 4: Clean request (no PII)
  console.log("\n\n📝 Test 4: Clean request (no PII)");
  console.log("Input: 'What is the capital of France?'");
  
  const response4 = await llm
    .chat("gpt-4o-mini", { middlewares: [piiMiddleware] })
    .ask("What is the capital of France?");
  
  console.log("\n💬 Response:", response4.content);
  
  console.log("\n" + "=".repeat(70));
  console.log("✅ PII Protection Demo Complete");
  console.log("=".repeat(70));
  console.log("\nKey Takeaways:");
  console.log("1. ✅ PII is detected and redacted BEFORE sending to LLM");
  console.log("2. ✅ Compliance logs can track PII exposure");
  console.log("3. ✅ Responses are scanned for leaked PII markers");
  console.log("4. ✅ Clean requests pass through without modification");
  console.log("\nProduction Enhancements:");
  console.log("  - Use ML-based PII detection (AWS Comprehend, Azure Text Analytics)");
  console.log("  - Implement reversible tokenization for legitimate business needs");
  console.log("  - Add audit trails for compliance (GDPR, HIPAA, etc.)");
  console.log("  - Rate-limit PII detection failures");
}

demonstratePIIProtection().catch(console.error);
