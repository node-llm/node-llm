import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "anthropic",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log("=== Debug Mode Configuration ===\n");

  console.log("1. Enable debug mode programmatically:");

  const chat = llm.chat("claude-3-5-haiku");
  console.log(`Created chat with model: ${chat.modelId}`);
  console.log("(Debug logs should appear above showing model resolution)\n");

  console.log("2. Disable debug mode:");

  const chat2 = llm.chat("claude-3-5-haiku");
  console.log(`Created chat with model: ${chat2.modelId}`);
  console.log("(No debug logs should appear)\n");

  console.log("3. Debug mode in scoped provider:");
  const scopedWithDebug = NodeLLM.withProvider("anthropic", { debug: true });
  const chat3 = scopedWithDebug.chat("claude-3-5-haiku");
  console.log(`Scoped chat model: ${chat3.modelId}`);
  console.log("(Debug logs should appear for scoped instance only)\n");
}

main().catch(e => { console.error(e); process.exit(1); });
