import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "deepseek" });

  console.log("Fetching DeepSeek models...");
  const models = await LLM.listModels();
  
  if (models.length === 0) {
      console.log("No models found.");
  }

  for (const model of models) {
    console.log(`- ${model.id} (${model.provider})`);
    console.log(`  Context Window: ${model.context_window}`);
  }
}

main().catch(console.error);
