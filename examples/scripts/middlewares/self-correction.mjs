import { NodeLLM, SchemaSelfCorrection, z } from "../../../packages/core/dist/index.js";

// 1. Define a strict schema
const movieSchema = z.object({
  title: z.string(),
  release_year: z.number(), // LLMs often return as string, e.g. "1994"
  actors: z.array(z.string()).min(2)
});

// 2. Wrap your instance with the self-correction middleware
const llm = NodeLLM.withProvider("openai").withMiddlewares([
  SchemaSelfCorrection({ maxRetries: 2 })
]);

async function main() {
  console.log("--- Schema Self-Correction Example ---");
  
  // We'll use a model that isn't using native JSON mode to see correction in action (simulated)
  // Note: For OpenAI gpt-4o, we have Strict Mode, so this middleware is a backup.
  // For Claude/Gemini/Ollama, this is the primary reliability layer.
  
  const chat = llm.chat("gpt-4o", {
    schema: { definition: { name: "Movie", schema: movieSchema } }
  });

  try {
    const movie = await chat.ask("Tell me about the movie Inception.");
    
    console.log("Validated Data:", movie.data);
    console.log("Call counts to LLM:", chat.history.filter(m => m.role === 'assistant').length);
    
  } catch (err) {
    console.error("Failed even after retries:", err);
  }
}

main();
