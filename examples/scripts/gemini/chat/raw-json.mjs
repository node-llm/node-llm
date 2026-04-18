import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

/**
 * This example demonstrates defining tools using raw JSON Schema and plain objects for Gemini.
 * RECOMMENDED: Use class-based tools (see tools.mjs) for better type safety and DX.
 */

const weatherTool = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Get the current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" },
        unit: { type: "string", enum: ["celsius", "fahrenheit"] }
      },
      required: ["location"]
    }
  },
  handler: async ({ location, unit = "celsius" }) => {
    console.log(`[Gemini Raw Tool] get_weather(${location}, ${unit})`);
    return JSON.stringify({ location, temperature: 22, unit });
  }
};

async function main() {
  const llm = createLLM({
    provider: "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY
  });
  const chat = llm.chat("gemini-1.5-flash").withTool(weatherTool);

  console.log("Asking Gemini: What's the weather in Paris?");
  const response = await chat.ask("What's the weather in Paris?");
  console.log("\nResponse:", response.content);
}

main().catch(e => { console.error(e); process.exit(1); });
