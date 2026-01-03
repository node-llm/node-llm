import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  });
  
  NodeLLM.configure({ provider: "deepseek" });

  const chat = NodeLLM.chat("deepseek-chat");

  console.log("--- Standard Request with withParams ---");
  
  // Example: Setting parameters supported by DeepSeek (and often OpenAI)
  // Also setting NODELLM_DEBUG=true to see the request
  process.env.NODELLM_DEBUG = "true";

  const response = await chat
    .withParams({ 
        presence_penalty: 0.5,
        frequency_penalty: 0.5
    })
    .ask("Generate a random number.");

  console.log("Response:", response.content);
}

main().catch(console.error);
