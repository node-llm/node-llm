import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure((config) => {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  });
  
  LLM.configure({ provider: "gemini" });

  const chat = LLM.chat("gemini-2.0-flash");

  process.env.NODELLM_DEBUG = "true";

  console.log("--- Gemini Request with withParams ---");
  
  // Example: Setting topP and safetySettings via withParams
  const response = await chat
    .withParams({ 
        generationConfig: {
            topP: 0.8,
            topK: 40
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_LOW_AND_ABOVE"
            }
        ]
    })
    .ask("Tell me a joke about robots.");

  console.log("Response:", response.content);
}

main().catch(console.error);
