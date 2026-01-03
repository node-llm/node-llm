import "dotenv/config";
import { NodeLLM, z } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  });
  
  NodeLLM.configure({ provider: "anthropic" });

  const chat = NodeLLM.chat("claude-3-haiku-20240307");

  // --- Example 1: Using Zod (Recommended) ---
  const bookSchema = z.object({
    title: z.string(),
    author: z.string(),
    chapters: z.array(z.object({
      number: z.number(),
      title: z.string()
    })),
    summary: z.string()
  });

  console.log("--- Structured Output (Zod) ---");
  const response = await chat
    .withSchema(bookSchema)
    .ask("Generate a concept for a short sci-fi book.");

  console.log("Parsed Book Title:", response.parsed.title);
  console.log("JSON:", JSON.stringify(response.parsed, null, 2));

  // --- Example 2: Using Manual JSON Schema ---
  const manualSchema = {
    type: "object",
    properties: {
      hero_name: { type: "string" },
      superpower: { type: "string" },
      origin_story: { type: "string" }
    },
    required: ["hero_name", "superpower", "origin_story"]
  };

  console.log("\n--- Structured Output (Manual JSON Schema) ---");
  const response2 = await chat
    .withSchema(manualSchema)
    .ask("Generate a superhero character.");

  console.log("Parsed Hero Name:", response2.parsed.hero_name);
  console.log("JSON:", JSON.stringify(response2.parsed, null, 2));
}

main().catch(console.error);
