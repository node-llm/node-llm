import "dotenv/config";
import { LLM } from "../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "openai" });

  console.log("--- Basic Embedding Generation ---\n");

  // Single text embedding
  console.log("1. Single text embedding:");
  const embedding = await LLM.embed("Ruby is a programmer's best friend");
  
  console.log(`Model: ${embedding.model}`);
  console.log(`Dimensions: ${embedding.dimensions}`);
  console.log(`Input tokens: ${embedding.input_tokens}`);
  console.log(`Vector (first 5 values): [${embedding.vector.slice(0, 5).join(", ")}...]`);
  console.log();

  // Batch embeddings
  console.log("2. Batch embeddings:");
  const batchEmbedding = await LLM.embed([
    "Node.js is fast and scalable",
    "TypeScript adds type safety",
    "LLMs are transforming software"
  ]);
  
  console.log(`Model: ${batchEmbedding.model}`);
  console.log(`Number of vectors: ${batchEmbedding.vectors.length}`);
  console.log(`Dimensions: ${batchEmbedding.dimensions}`);
  console.log(`Total input tokens: ${batchEmbedding.input_tokens}`);
  console.log();

  // Custom model and dimensions
  console.log("3. Custom model with reduced dimensions:");
  const customEmbedding = await LLM.embed("Embeddings for semantic search", {
    model: "text-embedding-3-large",
    dimensions: 256  // Reduce from default 3072 to 256
  });
  
  console.log(`Model: ${customEmbedding.model}`);
  console.log(`Dimensions: ${customEmbedding.dimensions}`);
  console.log(`Input tokens: ${customEmbedding.input_tokens}`);
  console.log();

  // Similarity calculation example
  console.log("4. Cosine similarity example:");
  const text1 = await LLM.embed("The cat sat on the mat");
  const text2 = await LLM.embed("A feline rested on the rug");
  const text3 = await LLM.embed("JavaScript is a programming language");
  
  const similarity12 = cosineSimilarity(text1.vector, text2.vector);
  const similarity13 = cosineSimilarity(text1.vector, text3.vector);
  
  console.log(`Similarity (cat/feline): ${similarity12.toFixed(4)} - Similar meaning!`);
  console.log(`Similarity (cat/JavaScript): ${similarity13.toFixed(4)} - Different topics!`);
}

// Helper function to calculate cosine similarity
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

main().catch(console.error);
