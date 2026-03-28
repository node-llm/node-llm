import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });
  const chat = llm.chat("gpt-4o-mini");

  // --- Example 1: Using Zod (Recommended) ---
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

  const manualResponseFormat = {
    type: "json_schema",
    json_schema: {
      name: "task_schema",
      strict: true,
      schema: manualSchema
    }
  };

  console.log("\n--- Structured Output (Manual JSON Schema) ---");
  const response2 = await chat
    .withRequestOptions({ responseFormat: manualResponseFormat })
    .ask("Create a high priority task for sending a weekly report by Friday.");

  console.log("Parsed Action Item:", response2.parsed.action_item);
  console.log("JSON:", JSON.stringify(response2.parsed, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
