import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({ 
    openrouterApiKey: process.env.OPENROUTER_API_KEY, 
    provider: "openrouter" 
  });

  console.log("--- Single Embedding ---");
  const response = await NodeLLM.embed("Hello OpenRouter!", {
    model: "text-embedding-3-small"
  });
  console.log(`Vector dimensions: ${response.vectors[0].length}`);

  console.log("\n--- Batch Embedding ---");
  const batchResponse = await NodeLLM.embed(["Hello", "World"], {
    model: "text-embedding-3-small"
  });
  console.log(`Generated ${batchResponse.vectors.length} vectors.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
