import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  console.log("=== Debug Mode Configuration ===\n");
  
  console.log("1. Enable debug mode programmatically:");
  NodeLLM.configure({ debug: true });
  
  NodeLLM.configure({ provider: "anthropic" });
  
  const chat = NodeLLM.chat("claude-3-5-haiku");
  console.log(`Created chat with model: ${chat.modelId}`);
  console.log("(Debug logs should appear above showing model resolution)\n");
  
  console.log("2. Disable debug mode:");
  NodeLLM.configure({ debug: false });
  
  const chat2 = NodeLLM.chat("claude-3-5-haiku");
  console.log(`Created chat with model: ${chat2.modelId}`);
  console.log("(No debug logs should appear)\n");
  
  console.log("3. Debug mode in scoped provider:");
  const scopedWithDebug = NodeLLM.withProvider("anthropic", { debug: true });
  const chat3 = scopedWithDebug.chat("claude-3-5-haiku");
  console.log(`Scoped chat model: ${chat3.modelId}`);
  console.log("(Debug logs should appear for scoped instance only)\n");
}

main().catch(console.error);
