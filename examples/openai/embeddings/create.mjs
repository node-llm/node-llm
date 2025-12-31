import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "openai" });

  console.log("--- Single Item Embedding ---");
  const single = await LLM.embed("Node-LLM makes AI easy!");
  console.log(`Vector length: ${single.vector.length}`);

  console.log("\n--- Batch Embedding ---");
  // Some providers optimize batch requests
  const batch = await LLM.embed([
    "JavaScript is awesome",
    "OpenAI models are powerful"
  ]);

  console.log(`Batch count: ${batch.vectors.length}`);
  batch.vectors.forEach((vec, i) => console.log(`Vector ${i}: ${vec.length} dims`));
}

main().catch(console.error);
