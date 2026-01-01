import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({
    provider: "anthropic",
  });

  try {
    const models = await LLM.listModels();
    console.log("Available Models:");
    models.forEach(m => console.log(`- ${m.id}`));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

main();
