import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  console.log("=== Model Alias Resolution Logging ===\n");
  
  NodeLLM.configure({ debug: true, provider: "anthropic" });
  
  console.log("1. Using alias 'claude-3-5-haiku':");
  const chat1 = NodeLLM.chat("claude-3-5-haiku");
  console.log(`   Resolved to: ${chat1.modelId}\n`);
  
  console.log("2. Using alias 'claude-sonnet-4-5':");
  const chat2 = NodeLLM.chat("claude-sonnet-4-5");
  console.log(`   Resolved to: ${chat2.modelId}\n`);
  
  console.log("3. Using direct model ID 'claude-3-haiku-20240307':");
  const chat3 = NodeLLM.chat("claude-3-haiku-20240307");
  console.log(`   Resolved to: ${chat3.modelId}\n`);
  
  console.log("4. Using unknown alias 'my-custom-model':");
  const chat4 = NodeLLM.chat("my-custom-model");
  console.log(`   Resolved to: ${chat4.modelId}\n`);
  
  console.log("\nNote: Debug logs above show alias resolution process");
  console.log("This helps debug 404 errors by showing the actual model ID being used");
}

main().catch(console.error);
