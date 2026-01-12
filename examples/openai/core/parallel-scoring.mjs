/**
 * Multi-Provider Parallel Execution
 * 
 * This demonstrates how to use `NodeLLM.withProvider()` to create 
 * scoped, independent contexts for parallel execution without 
 * risk of race conditions or having to manually manage instances.
 */

import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

// 1. Initial global configuration (sets keys)
NodeLLM.configure((config) => {
  config.openaiApiKey = process.env.OPENAI_API_KEY;
  config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  config.geminiApiKey = process.env.GEMINI_API_KEY;
});

/**
 * Score an answer using multiple providers in TRUE parallel.
 * Each provider call is isolated using .withProvider()
 */
async function scoreAnswerParallel(question, answer) {
  console.log("⏳ Starting parallel scoring (isolated contexts)...\n");

  const results = await Promise.all([
    // Each of these returns a scoped instance of NodeLLM
    NodeLLM.withProvider("openai").chat("gpt-4o-mini").ask(createPrompt(question, answer)),
    NodeLLM.withProvider("anthropic").chat("claude-3-5-haiku-20241022").ask(createPrompt(question, answer)),
    NodeLLM.withProvider("gemini").chat("gemini-2.0-flash-exp").ask(createPrompt(question, answer)),
  ]);

  return results;
}

function createPrompt(question, answer) {
  return `Score this student answer from 1-10.
Question: ${question}
Answer: ${answer}

Return exactly: "Score: [X]" followed by reasoning.`;
}

async function main() {
  const q = "What is the capital of France?";
  const a = "Paris is the capital and largest city of France.";

  try {
    const responses = await scoreAnswerParallel(q, a);

    responses.forEach((resp, i) => {
      const providers = ["OpenAI", "Anthropic", "Gemini"];
      console.log(`🤖 ${providers[i]}: ${resp.content.split('\n')[0]}`);
    });

    console.log("\n✅ Parallel multi-provider execution successful!");
    console.log("No race conditions, no manual instantiation needed. 🚀");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main();
