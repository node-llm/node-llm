import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";
import { z } from "zod";

async function main() {
  const llm = NodeLLM.withProvider("xai");
  const chat = llm.chat("grok-3");

  // Define a schema using Zod
  const UserSchema = z.object({
    name: z.string(),
    age: z.number(),
    hobbies: z.array(z.string())
  });

  console.log("Requesting structured data from xAI...");
  const response = await chat
    .withSchema(UserSchema)
    .ask("Create a fictional user profile for someone who likes surfing.");

  console.log("\nParsed Object:");
  // response.parsed contains the properly typed object
  console.log(JSON.stringify(response.parsed, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
