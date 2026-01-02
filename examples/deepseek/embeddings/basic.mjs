import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "deepseek" });
  
  console.log("Attempting to run embeddings with DeepSeek...");
  try {
    // This should fail as embeddings are not supported/implemented
    await LLM.embed({ input: "Hello world" });
  } catch (error) {
    console.log("✅ Correctly caught unsupported operation error:");
    console.error(error.message);
  }
}

main().catch(console.error);
