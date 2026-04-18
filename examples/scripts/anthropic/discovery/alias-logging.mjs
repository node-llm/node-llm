import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "anthropic",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log("=== Model Alias Resolution Logging ===\n");

  console.log("1. Using alias 'claude-3-5-haiku':");
  const chat1 = llm.chat("claude-3-5-haiku");
  console.log(`   Resolved to: ${chat1.modelId}\n`);

  console.log("2. Using alias 'claude-sonnet-4-5':");
  const chat2 = llm.chat("claude-sonnet-4-5");
  console.log(`   Resolved to: ${chat2.modelId}\n`);

  console.log("3. Using direct model ID 'claude-3-haiku-20240307':");
  const chat3 = llm.chat("claude-3-haiku-20240307");
  console.log(`   Resolved to: ${chat3.modelId}\n`);

  console.log("4. Using unknown alias 'my-custom-model':");
  const chat4 = llm.chat("my-custom-model");
  console.log(`   Resolved to: ${chat4.modelId}\n`);

  console.log("\nNote: Debug logs above show alias resolution process");
  console.log("This helps debug 404 errors by showing the actual model ID being used");
}

main().catch(e => { console.error(e); process.exit(1); });
