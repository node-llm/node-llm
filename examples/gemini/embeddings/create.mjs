import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "gemini" });

  console.log("--- Gemini Embedding ---");
  const embedding = await NodeLLM.embed("Gemini models are incredibly versatile.");
  console.log(`Vector length: ${embedding.vector.length}`);

  console.log("\n--- Batch Embedding ---");
  const batch = await NodeLLM.embed([
    "Multimodal AI is the future",
    "NodeLLM supports Google Gemini"
  ]);

  console.log(`Batch count: ${batch.vectors.length}`);
}

main().catch(console.error);
