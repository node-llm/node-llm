import "dotenv/config";
import { NodeLLM, z } from "../../../../packages/core/dist/index.js";

const deployment = process.env.AZURE_MODEL || "gpt-4o";

async function main() {
  const llm = NodeLLM.withProvider("azure");

  const recipe = z.object({
    name: z.string(),
    ingredients: z.array(z.object({ item: z.string(), amount: z.string() })),
    steps: z.array(z.string()),
    prep_time_minutes: z.number()
  });

  console.log("--- Structured output (Zod) ---");
  const response = await llm
    .chat(deployment)
    .withSchema(recipe)
    .ask("Give me a simple recipe for a peanut butter sandwich.");
  console.log("Recipe:", response.parsed.name);
  console.log(JSON.stringify(response.parsed, null, 2));

  console.log("\n--- JSON mode ---");
  const json = await llm
    .chat(deployment)
    .withRequestOptions({ responseFormat: { type: "json_object" } })
    .ask("List 3 programming languages with the year each was created, as JSON.");
  console.log(json.data);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
