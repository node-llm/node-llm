import { NodeLLM } from "@node-llm/core";
import "dotenv/config";

/**
 * Amazon Bedrock Embeddings Example
 * 
 * Demonstrates using Amazon Titan Text Embeddings V2.
 */
async function main() {
  const llm = NodeLLM.withProvider("bedrock");
  const model = "amazon.titan-embed-text-v2:0";

  console.log(`Generating embeddings using ${model}...`);

  // Single input
  const res1 = await llm.embed("NodeLLM makes AWS Bedrock easy to use.", { model });
  console.log("\nSingle Input:");
  console.log(`- Dimensions: ${res1.dimensions}`);
  console.log(`- Input Tokens: ${res1.input_tokens}`);
  console.log(`- Vector Preview: [${res1.vectors[0].slice(0, 5).join(", ")}, ...]`);

  // Multi input
  const texts = [
    "Machine learning is a subset of AI.",
    "RAG stands for Retrieval-Augmented Generation."
  ];
  const res2 = await llm.embed(texts, { model });
  console.log("\nMulti Input:");
  console.log(`- Count: ${res2.vectors.length}`);
  console.log(`- Input Tokens: ${res2.input_tokens}`);
  res2.vectors.forEach((v, i) => {
    console.log(`  [${i}] -> [${v.slice(0, 3).join(", ")}, ...]`);
  });
}

main().catch(console.error);
