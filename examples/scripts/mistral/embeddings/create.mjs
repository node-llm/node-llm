import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("mistral");

  // --- Single Item Embedding ---
  console.log("--- Single Item Embedding ---");
  const single = await llm.embed("Mistral AI makes powerful open-source models!");
  console.log(`Vector length: ${single.vector.length}`);
  console.log(`First 5 values: [${single.vector.slice(0, 5).map(v => v.toFixed(4)).join(", ")}...]`);

  // --- Batch Embedding ---
  console.log("\n--- Batch Embedding ---");
  const batch = await llm.embed([
    "JavaScript is a versatile programming language",
    "Python is great for machine learning",
    "TypeScript adds type safety to JavaScript"
  ]);

  console.log(`Batch count: ${batch.vectors.length}`);
  batch.vectors.forEach((vec, i) => console.log(`Vector ${i}: ${vec.length} dimensions`));

  // --- Embedding with specific model ---
  console.log("\n--- Embedding with Specific Model ---");
  const withModel = await llm.embed("Custom embedding request", { model: "mistral-embed" });
  console.log(`Model used: mistral-embed`);
  console.log(`Vector length: ${withModel.vector.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
