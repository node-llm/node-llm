import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

/**
 * Example: Scoped Provider Configuration
 *
 * This demonstrates how to use withProvider() with scoped configuration
 * to enable true parallelism with different credentials without global mutations.
 */

async function main() {
  const llm = createLLM({
    provider: "anthropic",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log("=== Example: Scoped Provider Configuration ===\n");

  // Example 1: Basic scoped provider (uses global config)
  console.log("1. Basic scoped provider:");
  const anthropic1 = NodeLLM.withProvider("anthropic");
  const chat1 = anthropic1.chat();
  console.log(`   Model: ${chat1.modelId}\n`);

  // Example 2: Scoped provider with custom API key
  console.log("2. Scoped provider with custom configuration:");
  const anthropic2 = NodeLLM.withProvider("anthropic", {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY, // Could be different key
    anthropicApiBase: process.env.ANTHROPIC_API_BASE || "https://api.anthropic.com/v1"
  });
  const chat2 = anthropic2.chat("claude-3-5-haiku");
  console.log(`   Model: ${chat2.modelId}`);
  console.log(`   Config is isolated: ${anthropic1.config !== anthropic2.config}\n`);

  // Example 3: True parallel execution with different providers
  console.log("3. Parallel execution with different providers:");

  const prompt = "What is 2+2? Answer in one word.";

  try {
    const [response1, response2] = await Promise.all([
      NodeLLM.withProvider("anthropic").chat("claude-3-5-haiku").ask(prompt),
      NodeLLM.withProvider("anthropic", {
        anthropicApiKey: process.env.ANTHROPIC_API_KEY
      })
        .chat("claude-3-5-haiku")
        .ask(prompt)
    ]);

    console.log(`   Response 1: ${response1.content}`);
    console.log(`   Response 2: ${response2.content}`);
  } catch (error) {
    console.log(`   Note: Parallel execution works, but requires valid API keys`);
    console.log(`   Error: ${error.message}`);
  }

  console.log("\n=== Key Benefits ===");
  console.log("✓ No global config mutations");
  console.log("✓ True parallelism without race conditions");
  console.log("✓ Different credentials per request");
  console.log("✓ Isolated configuration scopes");
}

main().catch(e => { console.error(e); process.exit(1); });
