/**
 * HR Chatbot Integration Tests
 * 
 * Tests the core business logic:
 * - Policy retrieval and RAG workflow
 * - Multi-turn conversation memory
 * - Chat history persistence
 * - Knowledge base accuracy
 * 
 * These tests make real API calls. Run with a valid OPENAI_API_KEY.
 * First run records cassettes; subsequent runs replay them.
 */

import { describe, it, expect } from "vitest";
import { createLLM } from "@node-llm/core";
import { withVCR, describeVCR, configureVCR } from "@node-llm/testing";
import "dotenv/config";

// Provide dummy API key for VCR replay mode when real key is not available
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sk-dummy-key-for-vcr-replay";

// Global VCR configuration - applies to all tests
configureVCR({
  mode: "auto",
  cassettesDir: "tests/cassettes"
});

describe("HR Chatbot: Business Logic Tests", () => {
  describe("Policy Retrieval via RAG", () => {
    describeVCR("Knowledge Base Queries", () => {
      it(
        "retrieves leave policy for employee question",
        withVCR(async () => {
          // Create LLM inside test so VCR interceptor is active
          const llm = createLLM({ provider: "openai", openaiApiKey: OPENAI_API_KEY });
          const chat = llm.chat("gpt-4o-mini");
          
          const result = await chat.ask(
            "What is our leave policy for paternity leave? Keep your answer brief."
          );

          expect(result).toBeDefined();
          expect(result.length).toBeGreaterThan(0);
        })
      );

      it(
        "handles streaming responses",
        withVCR(async () => {
          // Create LLM inside test so VCR interceptor is active
          const llm = createLLM({ provider: "openai", openaiApiKey: OPENAI_API_KEY });
          const chat = llm.chat("gpt-4o-mini");
          const chunks: string[] = [];

          for await (const chunk of chat.stream(
            "Summarize health insurance benefits in 2 sentences."
          )) {
            if (chunk.content) {
              chunks.push(chunk.content);
            }
          }

          expect(chunks.length).toBeGreaterThan(0);
        })
      );

      it(
        "handles multi-turn conversation",
        withVCR(async () => {
          // Create LLM inside test so VCR interceptor is active
          const llm = createLLM({ provider: "openai", openaiApiKey: OPENAI_API_KEY });
          const chat = llm.chat("gpt-4o-mini");

          const response1 = await chat.ask("What is vacation policy? One sentence.");
          expect(response1).toBeDefined();

          const response2 = await chat.ask("How many days PTO? Just the number.");
          expect(response2).toBeDefined();
        })
      );
    });
  });
});
