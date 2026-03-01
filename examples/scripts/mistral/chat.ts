/**
 * Example: Mistral AI Chat
 *
 * Demonstrates basic usage of the Mistral provider.
 *
 * Run: pnpm tsx examples/scripts/mistral/chat.ts
 */

import { createLLM } from "@node-llm/core";

const llm = createLLM({ provider: "mistral" });

const response = await llm
  .chat("mistral-large-latest")
  .system("You are a helpful assistant.")
  .say("What makes Mistral AI unique among LLM providers?");

console.log(response.text);
console.log("\n---");
console.log("Model:", response.model);
console.log("Input tokens:", response.tokenUsage?.input);
console.log("Output tokens:", response.tokenUsage?.output);
