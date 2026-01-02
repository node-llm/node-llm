
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  console.log("🦙 Ollama Embeddings Example");
  LLM.configure({ provider: "ollama" });
  
  // Note: 'nomic-embed-text' is a popular embedding model on Ollama. 
  // You can also use 'llama3', but dedicated models are better for embeddings.
  const model = "nomic-embed-text"; 
  
  console.log(`Generating embeddings using ${model}...`);
  
  const text1 = "The cat chases the mouse.";
  const text2 = "A feline is running after a rodent.";
  const text3 = "The planet Jupiter is a gas giant.";

  try {
      const emb1 = await LLM.embed(text1, { model });
      const emb2 = await LLM.embed(text2, { model });
      const emb3 = await LLM.embed(text3, { model });
      
      console.log("Embedding vector length:", emb1.vector.length);
      
      const score1 = cosineSimilarity(emb1.vector, emb2.vector);
      console.log(`Similarity (Cat vs Feline): ${score1.toFixed(4)}`);
      
      const score2 = cosineSimilarity(emb1.vector, emb3.vector);
      console.log(`Similarity (Cat vs Jupiter): ${score2.toFixed(4)}`);
      
  } catch (error) {
      console.error("Error:", error.message);
      console.info("Hint: Ensure you have the model pulled.");
  }
}

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

main();
