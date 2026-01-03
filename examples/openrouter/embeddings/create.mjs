import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ 
    openrouterApiKey: process.env.OPENROUTER_API_KEY, 
    provider: "openrouter" 
  });

  console.log("--- Single Embedding ---");
  const response = await LLM.embed("Hello OpenRouter!", {
    model: "text-embedding-3-small"
  });
  console.log(`Vector dimensions: ${response.vectors[0].length}`);

  console.log("\n--- Batch Embedding ---");
  const batchResponse = await LLM.embed(["Hello", "World"], {
    model: "text-embedding-3-small"
  });
  console.log(`Generated ${batchResponse.vectors.length} vectors.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
