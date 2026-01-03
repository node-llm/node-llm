import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({
    provider: "anthropic",
  });

  try {
    const models = await NodeLLM.listModels();
    console.log("Available Models:");
    models.forEach(m => console.log(`- ${m.id}`));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

main();
