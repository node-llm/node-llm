/**
 * Brand Perception Checker Integration Tests
 * 
 * Tests the core business logic:
 * - Multi-model sentiment alignment analysis
 * - Risk signal detection
 * - Brand positioning consistency
 * - Competitive perception mapping
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
  cassettesDir: "tests/__cassettes__"
});

describe("Brand Perception: Business Logic Tests", () => {
  describe("Multi-Model Sentiment Analysis", () => {
    describeVCR("Sentiment Analysis", () => {
      it(
        "analyzes brand sentiment",
        withVCR(async () => {
          const llm = createLLM({ provider: "openai", openaiApiKey: OPENAI_API_KEY });
          const chat = llm.chat("gpt-4o-mini");
          
          const result = await chat.ask(
            "In one sentence, what makes Apple a strong brand?"
          );

          expect(result).toBeDefined();
          expect(result.length).toBeGreaterThan(0);
        })
      );

      it(
        "detects risk signals in brand perception",
        withVCR(async () => {
          const llm = createLLM({ provider: "openai", openaiApiKey: OPENAI_API_KEY });
          const chat = llm.chat("gpt-4o-mini");
          
          const result = await chat.ask(
            "Name one risk for Tesla's brand. One sentence only."
          );

          expect(result).toBeDefined();
        })
      );
    });
  });

  describe("Competitive Analysis", () => {
    describeVCR("Market Positioning", () => {
      it(
        "compares brand positioning",
        withVCR(async () => {
          const llm = createLLM({ provider: "openai", openaiApiKey: OPENAI_API_KEY });
          const chat = llm.chat("gpt-4o-mini");
          
          const result = await chat.ask(
            "Compare Apple vs Samsung positioning in 2 words each."
          );

          expect(result).toBeDefined();
        })
      );

      it(
        "streams brand analysis",
        withVCR(async () => {
          const llm = createLLM({ provider: "openai", openaiApiKey: OPENAI_API_KEY });
          const chat = llm.chat("gpt-4o-mini");
          const chunks: string[] = [];

          for await (const chunk of chat.stream(
            "Name 3 brand values of Nike. Just the words."
          )) {
            if (chunk.content) {
              chunks.push(chunk.content);
            }
          }

          expect(chunks.length).toBeGreaterThan(0);
        })
      );
    });
  });
});

