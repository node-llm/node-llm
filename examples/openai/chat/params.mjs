import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure((config) => {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  });
  
  LLM.configure({ provider: "openai" });

  const chat = LLM.chat("gpt-4o-mini");

  console.log("--- Standard Request with withParams ---");
  
  // Example: Setting a seed for deterministic output (OpenAI specific)
  // Also setting NODELLM_DEBUG=true to see the request
  process.env.NODELLM_DEBUG = "true";

  const response = await chat
    .withParams({ 
        seed: 42,
        user: "test-user-123",
        presence_penalty: 0.5 
    })
    .ask("Generate a random number.");

  console.log("Response:", response.content);
}

main().catch(console.error);
