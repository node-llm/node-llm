import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY
  });
  console.log("--- Gemini Embedding ---");
  const embedding = await llm.embed("Gemini models are incredibly versatile.");
  console.log(`Vector length: ${embedding.vector.length}`);

  console.log("\n--- Batch Embedding ---");
  const batch = await llm.embed(["Multimodal AI is the future", "NodeLLM supports Google Gemini"]);

  console.log(`Batch count: ${batch.vectors.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
