import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = createLLM({
    provider: "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY
  });
  const chat = llm.chat("gemini-2.0-flash");

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

main().catch(e => { console.error(e); process.exit(1); });
