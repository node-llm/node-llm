import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "deepseek",
    deepseekApiKey: process.env.DEEPSEEK_API_KEY
  });
  const chat = llm.chat("deepseek-chat");

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

main().catch(e => { console.error(e); process.exit(1); });
