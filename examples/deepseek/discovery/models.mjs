import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  });
  
  NodeLLM.configure({ provider: "deepseek" });

  console.log("Fetching DeepSeek models...");
  const models = await NodeLLM.listModels();
  
  if (models.length === 0) {
      console.log("No models found.");
  }

  for (const model of models) {
    console.log(`- ${model.id} (${model.provider})`);
    console.log(`  Context Window: ${model.context_window}`);
  }
}

main().catch(console.error);
