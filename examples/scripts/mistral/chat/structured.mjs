import "dotenv/config";
import { NodeLLM, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("mistral");
  const chat = llm.chat("mistral-large-latest");

  // --- Example 1: Using Zod Schema ---
  const recipeSchema = z.object({
    name: z.string(),
    ingredients: z.array(
      z.object({
        item: z.string(),
        amount: z.string()
      })
    ),
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

  // --- Example 3: JSON Response Format ---
  console.log("\n--- JSON Response Format ---");
  const response3 = await llm
    .chat("mistral-large-latest")
    .withResponseFormat({ type: "json_object" })
    .ask("List 3 programming languages with their year of creation. Return as JSON.");

  console.log("Raw JSON response:", response3.content);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
