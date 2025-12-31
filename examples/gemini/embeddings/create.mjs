import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "gemini" });

  console.log("--- Gemini Embedding ---");
  const embedding = await LLM.embed("Gemini models are incredibly versatile.");
  console.log(`Vector length: ${embedding.vector.length}`);

  console.log("\n--- Batch Embedding ---");
  const batch = await LLM.embed([
    "Multimodal AI is the future",
    "Node-LLM supports Google Gemini"
  ]);

  console.log(`Batch count: ${batch.vectors.length}`);
}

main().catch(console.error);
