import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

const deployment = process.env.AZURE_MODEL || "gpt-4o";

async function main() {
  const llm = NodeLLM.withProvider("azure");
  const chat = llm.chat(deployment);

  console.log("=== Streaming ===");
  for await (const chunk of chat.stream("Count from 1 to 5, one number per line.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\n");

  console.log("=== Streaming with history ===");
  await chat.ask("My name is Alice.");
  for await (const chunk of chat.stream("What's my name?")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
