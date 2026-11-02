import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

// The embedding deployment's name.
const deployment = process.env.AZURE_EMBEDDING_MODEL || "text-embedding-3-small";

async function main() {
  const llm = NodeLLM.withProvider("azure");

  console.log("--- Single embedding ---");
  const single = await llm.embed("Azure AI Foundry hosts many models.", { model: deployment });
  console.log(`Vector length: ${single.vector.length}`);

  console.log("\n--- Batch embedding ---");
  const batch = await llm.embed(
    ["JavaScript is a versatile language", "Python is great for machine learning"],
    { model: deployment }
  );
  batch.vectors.forEach((vector, i) => console.log(`Vector ${i}: ${vector.length} dimensions`));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
