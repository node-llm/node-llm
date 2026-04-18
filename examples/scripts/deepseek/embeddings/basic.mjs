import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "deepseek",
    deepseekApiKey: process.env.DEEPSEEK_API_KEY
  });
  console.log("Attempting to run embeddings with DeepSeek...");
  try {
    // This should fail as embeddings are not supported/implemented
    await llm.embed({ input: "Hello world" });
  } catch (error) {
    console.log("✅ Correctly caught unsupported operation error:");
    console.error(error.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
