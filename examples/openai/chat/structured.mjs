import "dotenv/config";
import { LLM, z } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "openai" });

  const chat = LLM.chat("gpt-4o-mini");

  // --- Example 1: Using Zod (Recommended) ---
  const recipeSchema = z.object({
    name: z.string(),
    ingredients: z.array(z.object({
      item: z.string(),
      amount: z.string()
    })),
    steps: z.array(z.string()),
    prep_time_minutes: z.number()
  });

  console.log("--- Structured Output (Zod) ---");
  const response = await chat
    .withSchema(recipeSchema)
    .ask("Give me a simple recipe for a peanut butter sandwich.");

  console.log("Parsed Recipe Name:", response.parsed.name);
  console.log("JSON:", JSON.stringify(response.parsed, null, 2));

  // --- Example 2: Using Manual JSON Schema ---
  const manualSchema = {
    type: "object",
    properties: {
      action_item: { type: "string" },
      due_date: { type: "string" },
      priority: { type: "string", enum: ["high", "medium", "low"] }
    },
    required: ["action_item", "due_date", "priority"],
    additionalProperties: false
  };

  console.log("\n--- Structured Output (Manual JSON Schema) ---");
  const response2 = await chat
    .withSchema(manualSchema)
    .ask("Create a high priority task for sending a weekly report by Friday.");

  console.log("Parsed Action Item:", response2.parsed.action_item);
  console.log("JSON:", JSON.stringify(response2.parsed, null, 2));
}

main().catch(console.error);
