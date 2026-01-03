import "dotenv/config";
import { NodeLLM, z } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "gemini" });

  const chat = NodeLLM.chat("gemini-2.0-flash");

  // --- Example 1: Using Zod (Recommended) ---
  const movieSchema = z.object({
    title: z.string(),
    director: z.string(),
    release_year: z.number(),
    genres: z.array(z.string()),
    rating: z.number().describe("Rating out of 10")
  });

  console.log("--- Structured Output (Zod) ---");
  const response = await chat
    .withSchema(movieSchema)
    .ask("Generate details for the movie Inception.");

  console.log("Parsed Movie Title:", response.parsed.title);
  console.log("JSON:", JSON.stringify(response.parsed, null, 2));

  // --- Example 2: Using Manual JSON Schema ---
  const manualSchema = {
    type: "object",
    properties: {
      location: { type: "string" },
      temperature: { type: "number" },
      unit: { type: "string", enum: ["celsius", "fahrenheit"] }
    },
    required: ["location", "temperature", "unit"]
  };

  console.log("\n--- Structured Output (Manual JSON Schema) ---");
  const response2 = await chat
    .withSchema(manualSchema)
    .ask("Extract weather info from: 'It is a sunny 25 degrees celsius in Barcelona today.'");

  console.log("Parsed Location:", response2.parsed.location);
  console.log("JSON:", JSON.stringify(response2.parsed, null, 2));
}

main().catch(console.error);
