/**
 * Extended Thinking Example
 * 
 * Demonstrates how to use the "Extended Thinking" feature with models like
 * OpenAI o3-mini and Anthropic Claude 3.7.
 */

import { NodeLLM } from "@node-llm/core";
import "dotenv/config";

async function main() {
  const llm = NodeLLM.withProvider("openai", {
    openaiApiKey: process.env.OPENAI_API_KEY
  });

  console.log("--- Standard Chat with Effort level ---");
  
  const chat = llm.chat("o3-mini")
    .withEffort("medium");

  const response = await chat.ask("Design a secure authentication system for a multi-tenant SaaS.");
  
  if (response.thinking) {
    console.log("\n[Thinking Result]");
    console.log(`Tokens: ${response.thinking.tokens}`);
    // console.log(`Text: ${response.thinking.text}`); // Some models don't return text, only tokens
  }
  
  console.log("\n[Answer]");
  console.log(response.content);

  console.log("\n--- Claude 4 with Thinking Budget ---");
  
  const anthropic = NodeLLM.withProvider("anthropic", {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });
  
  try {
    const claudeChat = anthropic.chat("claude-sonnet-4-20250514")
      .withThinking({ budget: 2000 });

    const stream = claudeChat.stream("Analyze the security implications of using JWTs for session management.");
    
    for await (const chunk of stream) {
      if (chunk.thinking?.text) {
        process.stdout.write(`\x1b[90m${chunk.thinking.text}\x1b[0m`);
      }
      if (chunk.content) {
        process.stdout.write(chunk.content);
      }
    }
  } catch (err) {
    console.warn("\n[Anthropic Example Skipped]");
    console.warn(err.message || err);
  }
}

main().catch(console.error);
